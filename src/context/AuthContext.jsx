import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [clinicData, setClinicData] = useState(null);
  const [activeStaff, setActiveStaff] = useState(null); // პერსონალური სესია
  const [loading, setLoading] = useState(true);

  const unsubUserRef = useRef(null);
  const unsubClinicRef = useRef(null); // რეფი კლინიკის მოსასმენად

  // პერსონალის ავტორიზაცია PIN-ით
  const staffLogin = (staffMember) => {
    setActiveStaff(staffMember);
    localStorage.setItem(`activeStaff_${currentUser?.uid}`, JSON.stringify(staffMember));
  };

  const staffLogout = () => {
    setActiveStaff(null);
    localStorage.removeItem(`activeStaff_${currentUser?.uid}`);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // ვასუფთავებთ წინა საბსქრაიბებს
      if (unsubUserRef.current) unsubUserRef.current();
      if (unsubClinicRef.current) unsubClinicRef.current();

      if (user) {
        setCurrentUser(user);
        
        const savedStaff = localStorage.getItem(`activeStaff_${user.uid}`);
        if (savedStaff) {
            try { setActiveStaff(JSON.parse(savedStaff)); } catch (e) {}
        }

        // 1. მომხმარებლის დოკუმენტის მოსმენა
        unsubUserRef.current = onSnapshot(doc(db, "users", user.uid), (userDoc) => {
          if (userDoc.exists()) {
            const uData = userDoc.data();
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
