import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        const p = await getUserProfile(auth.currentUser.uid);
        setProfile(p);
      } catch {
        // ignore permission errors
      }
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 2000);
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeout);
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        getUserProfile(firebaseUser.uid)
          .then(setProfile)
          .catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
    });
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
