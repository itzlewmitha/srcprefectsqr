import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: 'teacher' | 'admin' | null;
  loading: boolean;
  isHeadAdmin: boolean; // Initial hardcoded admin check
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isHeadAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'teacher' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && user.email) {
        try {
          const userDoc = await getDoc(doc(db, 'authorized_users', user.email.toLowerCase()));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else if (user.email === 'pixstudios.lk@gmail.com') {
            setRole('admin');
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isHeadAdmin = user?.email === 'pixstudios.lk@gmail.com' || role === 'admin';

  return (
    <AuthContext.Provider value={{ user, role, loading, isHeadAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
