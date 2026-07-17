import React, { createContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
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
          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserRole(data.role || ROLES.VIEWER);
            setUserData(data);
          } else {
            setUserRole(ROLES.VIEWER);
            setUserData({ email: user.email, role: ROLES.VIEWER, enabled: true });
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole(ROLES.VIEWER);
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
      // Temporary Mock Bypass for Local Testing
      if (email === 'admin@fuelguard.ai' && password === 'admin123') {
        const mockData = {
          user: { uid: 'MOCK_ADMIN_UID', email: 'admin@fuelguard.ai' },
          role: ROLES.SUPERADMIN,
          userData: { email: 'admin@fuelguard.ai', role: ROLES.SUPERADMIN, enabled: true, displayName: 'Super Admin' }
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
