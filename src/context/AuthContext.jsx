import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const collections = ['admin', 'staff', 'soloparent', 'pending_users', 'denied_users'];
        let foundData = null;
        let foundRole = null;
        
        for (let col of collections) {
          const docRef = doc(db, col, user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundData = docSnap.data();
            foundData = { uid: user.uid, ...foundData };
            foundRole = foundData.role || col;
            // normalize - gawing lowercase lahat
            if (foundRole === 'pending_users') foundRole = 'pending';
            if (foundRole === 'denied_users') foundRole = 'denied';
            console.log("FOUND IN:", col, "ROLE:", foundRole, "DATA:", foundData);
            break;
          }
        }
        setUserData(foundData);
        setUserRole(foundRole);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, userRole, userData, loading };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};