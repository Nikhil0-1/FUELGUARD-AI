import React, { createContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref, get, update } from 'firebase/database';
import { auth, db } from '../config/firebase';
import { ROLES } from '../config/constants';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if mock user is stored in localStorage to preserve session on refresh
    const savedMock = localStorage.getItem('fg_mock_user');
    if (savedMock) {
      try {
        const data = JSON.parse(savedMock);
        setCurrentUser(data.user);
        setUserRole(data.role);
        setUserData(data.userData);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('fg_mock_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userRef = ref(db, `FuelGuardAI/Users/${user.uid}`);
          const snapshot = await get(userRef);
          
          let role = ROLES.VIEWER;
          let uData = { email: user.email, role: ROLES.VIEWER, enabled: true };
          
          // Force superadmin role for admin@fuelguard.ai email in production
          if (user.email === 'admin@fuelguard.ai') {
            role = ROLES.SUPERADMIN;
            uData = { email: user.email, role: ROLES.SUPERADMIN, enabled: true, displayName: 'Super Admin' };
          }
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            role = data.role || role;
            uData = { ...uData, ...data };
          }
          
          setUserRole(role);
          setUserData(uData);
        } catch (error) {
          console.error("Error fetching user role:", error);
          if (user.email === 'admin@fuelguard.ai') {
            setUserRole(ROLES.SUPERADMIN);
            setUserData({ email: user.email, role: ROLES.SUPERADMIN, enabled: true, displayName: 'Super Admin' });
          } else {
            setUserRole(ROLES.VIEWER);
          }
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Temporary Mock Bypass for Local Testing (Only for mockadmin)
      if (email === 'mockadmin@fuelguard.ai' && password === 'admin123') {
        const mockData = {
          user: { uid: 'MOCK_ADMIN_UID', email: 'mockadmin@fuelguard.ai' },
          role: ROLES.SUPERADMIN,
          userData: { email: 'mockadmin@fuelguard.ai', role: ROLES.SUPERADMIN, enabled: true, displayName: 'Mock Super Admin' }
        };
        localStorage.setItem('fg_mock_user', JSON.stringify(mockData));
        setCurrentUser(mockData.user);
        setUserRole(mockData.role);
        setUserData(mockData.userData);
        return { user: mockData.user };
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = ref(db, `FuelGuardAI/Users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists() && !snapshot.val().enabled) {
        await signOut(auth);
        throw new Error("Your account has been deactivated. Please contact your system administrator.");
      }
      return userCredential;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('fg_mock_user');
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    userRole,
    userData,
    loading,
    login,
    logout,
    resetPassword,
    isAuthenticated: !!currentUser,
    isSuperAdmin: userRole === ROLES.SUPERADMIN,
    isAdmin: userRole === ROLES.SUPERADMIN || userRole === ROLES.ADMIN,
    isOperator: userRole === ROLES.SUPERADMIN || userRole === ROLES.ADMIN || userRole === ROLES.OPERATOR
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
