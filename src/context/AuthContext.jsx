import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { isSuperAdminUser } from "../utils/superAdmin";

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

  // პერსონალის ავტორიზაცია PIN-ით
  const staffLogin = (staffMember) => {
    setActiveStaff(staffMember);
    localStorage.setItem(`activeStaff_${currentUser?.uid}`, JSON.stringify(staffMember));
  };

  const staffLogout = () => {
    setActiveStaff(null);
    if (currentUser?.uid) {
      localStorage.removeItem(`activeStaff_${currentUser.uid}`);
    }
  };

  // პერსონალის სტატუსის და როლის რეალურ დროში სინქრონიზაცია
  useEffect(() => {
    if (unsubStaffRef.current) {
      unsubStaffRef.current();
      unsubStaffRef.current = null;
    }

    if (currentUser && activeStaff?.id && activeStaff.id !== currentUser.uid) {
      unsubStaffRef.current = onSnapshot(doc(db, "users", activeStaff.id), (staffSnap) => {
        if (!staffSnap.exists()) {
          staffLogout();
        } else {
          const sData = staffSnap.data();
          if (sData.status === "suspended" || (userData?.clinicId && sData.clinicId !== userData.clinicId)) {
            staffLogout();
          } else if (sData.role !== activeStaff.role || sData.fullName !== activeStaff.fullName) {
            const updated = { ...activeStaff, role: sData.role, fullName: sData.fullName };
            setActiveStaff(updated);
            localStorage.setItem(`activeStaff_${currentUser.uid}`, JSON.stringify(updated));
          }
        }
      }, (err) => {
        console.warn("Staff live sync error:", err);
      });
    }

    return () => {
      if (unsubStaffRef.current) {
        unsubStaffRef.current();
        unsubStaffRef.current = null;
      }
    };
  }, [currentUser?.uid, activeStaff?.id, userData?.clinicId]);

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
            try { setActiveStaff(JSON.parse(savedStaff)); } catch (e) {}
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
  }, []);

  const value = {
    currentUser,
    userData,
    clinicData,
    activeStaff, // ვინ არის რეალურად სისტემაში
    staffLogin,
    staffLogout,
    loading,
    role: activeStaff?.role || userData?.role, // ვიყენებთ პერსონალის როლს თუ არჩეულია
    isAdmin: (activeStaff?.role || userData?.role) === "admin",
    isSuperAdmin: isSuperAdminUser(currentUser, userData),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
