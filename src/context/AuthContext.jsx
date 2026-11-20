import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { isSuperAdminUser } from "../utils/superAdmin";
import { normalizeRole } from "../utils/roleUtils";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [clinicData, setClinicData] = useState(null);
  const [activeStaff, setActiveStaff] = useState(null); // პერსონალური სესია
  const [loading, setLoading] = useState(true);

  const unsubUserRef = useRef(null);
  const unsubClinicRef = useRef(null); // რეფი კლინიკის მოსასმენად
  const unsubStaffRef = useRef(null); // რეფი პერსონალის რეალურ დროში შესამოწმებლად

  const toMinimalStaffSession = useCallback((staffMember, fallbackClinicId = null) => {
    if (!staffMember) return null;
    return {
      id: staffMember.id || staffMember.uid || null,
      fullName: staffMember.fullName || "",
      role: normalizeRole(staffMember.role) || staffMember.role || "",
      clinicId: staffMember.clinicId || fallbackClinicId || null,
    };
  }, []);

  const currentUid = currentUser?.uid;
  const currentClinicId = userData?.clinicId;

  // პერსონალის ავტორიზაცია PIN-ით
  const staffLogin = useCallback((staffMember) => {
    const sanitized = toMinimalStaffSession(staffMember, currentClinicId);
    setActiveStaff(sanitized);
    if (currentUid) {
      localStorage.setItem(`activeStaff_${currentUid}`, JSON.stringify(sanitized));
    }
  }, [currentUid, toMinimalStaffSession, currentClinicId]);

  const staffLogout = useCallback(() => {
    setActiveStaff(null);
    if (currentUid) {
      localStorage.removeItem(`activeStaff_${currentUid}`);
    }
  }, [currentUid]);

  // პერსონალის სტატუსის და როლის რეალურ დროში სინქრონიზაცია
  useEffect(() => {
    if (unsubStaffRef.current) {
      unsubStaffRef.current();
      unsubStaffRef.current = null;
    }

    if (!currentUser || !activeStaff?.id) {
      return;
    }

    // თუ არჩეულია კლინიკის მფლობელის ანგარიში, სინქრონიზდება უშუალოდ Firestore-ის userData-დან
    if (activeStaff.id === currentUser.uid) {
      if (userData) {
        if (userData.status === "suspended") {
          Promise.resolve().then(() => staffLogout());
        } else {
          const liveOwnerRole = normalizeRole(userData.role);
          const liveOwnerName = userData.fullName || "";
          if (
            liveOwnerRole !== normalizeRole(activeStaff.role) ||
            liveOwnerName !== activeStaff.fullName
          ) {
            const synced = toMinimalStaffSession(
              { id: currentUser.uid, fullName: liveOwnerName, role: liveOwnerRole, clinicId: userData.clinicId },
              userData.clinicId
            );
            Promise.resolve().then(() => {
              setActiveStaff(synced);
              localStorage.setItem(`activeStaff_${currentUser.uid}`, JSON.stringify(synced));
            });
          }
        }
      }
      return;
    }

    unsubStaffRef.current = onSnapshot(doc(db, "users", activeStaff.id), (staffSnap) => {
      if (!staffSnap.exists()) {
        staffLogout();
      } else {
        const sData = staffSnap.data();
        if (sData.status === "suspended" || (userData?.clinicId && sData.clinicId !== userData.clinicId)) {
          staffLogout();
        } else if (
          normalizeRole(sData.role) !== normalizeRole(activeStaff.role) ||
          sData.fullName !== activeStaff.fullName
        ) {
          const updated = toMinimalStaffSession(
            {
              id: activeStaff.id,
              role: normalizeRole(sData.role),
              fullName: sData.fullName,
              clinicId: sData.clinicId,
            },
            userData?.clinicId
          );
          setActiveStaff(updated);
          localStorage.setItem(`activeStaff_${currentUser.uid}`, JSON.stringify(updated));
        }
      }
    }, (err) => {
      console.warn("Staff live sync error:", err);
    });

    return () => {
      if (unsubStaffRef.current) {
        unsubStaffRef.current();
        unsubStaffRef.current = null;
      }
    };
  }, [currentUser, activeStaff, userData, staffLogout, toMinimalStaffSession]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // ვასუფთავებთ წინა საბსქრაიბებს
      if (unsubUserRef.current) unsubUserRef.current();
      if (unsubClinicRef.current) unsubClinicRef.current();
      if (unsubStaffRef.current) unsubStaffRef.current();

      if (user) {
        setCurrentUser(user);
        
        const savedStaff = localStorage.getItem(`activeStaff_${user.uid}`);
        if (savedStaff) {
          try {
            const parsed = JSON.parse(savedStaff);
            if (parsed && parsed.id) {
              setActiveStaff(toMinimalStaffSession(parsed));
            }
          } catch {
            localStorage.removeItem(`activeStaff_${user.uid}`);
          }
        }

        // 1. მომხმარებლის დოკუმენტის მოსმენა
        unsubUserRef.current = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
          if (userDoc.exists()) {
            const uData = { uid: userDoc.id, ...userDoc.data() };
            setUserData(uData);

            // 2. კლინიკის დოკუმენტის მოსმენა რეალურ დროში
            if (unsubClinicRef.current) unsubClinicRef.current();
            unsubClinicRef.current = onSnapshot(doc(db, "clinics", uData.clinicId), (clinicDoc) => {
              if (clinicDoc.exists()) {
                setClinicData({ id: clinicDoc.id, ...clinicDoc.data() });
              }
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        });
      } else {
        setCurrentUser(null);
        setUserData(null);
        setClinicData(null);
        setActiveStaff(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserRef.current) unsubUserRef.current();
      if (unsubClinicRef.current) unsubClinicRef.current();
      if (unsubStaffRef.current) unsubStaffRef.current();
    };
  }, [toMinimalStaffSession]);

  const isOwnerSession = Boolean(currentUser && activeStaff?.id === currentUser.uid && userData);
  const effectiveStaff = isOwnerSession
    ? { ...activeStaff, fullName: userData.fullName, role: normalizeRole(userData.role) }
    : activeStaff;

  const normalizedRole = effectiveStaff
    ? normalizeRole(effectiveStaff.role)
    : normalizeRole(userData?.role);

  const value = {
    currentUser,
    userData,
    clinicData,
    activeStaff: effectiveStaff, // ვინ არის რეალურად სისტემაში
    staffLogin,
    staffLogout,
    loading,
    role: normalizedRole, // ვიყენებთ პერსონალის როლს თუ არჩეულია
    isAdmin: normalizedRole === "admin",
    isSuperAdmin: isSuperAdminUser(currentUser, userData),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
