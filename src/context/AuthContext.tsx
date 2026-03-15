import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticate: (nick: string, discord: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const authenticate = async (nick: string, discord: string) => {
    const cleanNick = nick.trim();
    const cleanNickId = cleanNick.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDiscord = discord.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!cleanNickId || !cleanDiscord) throw new Error("Preencha campos válidos (letras e números).");
    
    const email = `${cleanNickId}@valiantshop.com`;
    const password = `${cleanDiscord}123456`.slice(0, 16);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (userCredential.user.displayName !== cleanNick) {
        await updateProfile(userCredential.user, { displayName: cleanNick });
        setUser({ ...userCredential.user, displayName: cleanNick });
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: cleanNick });
        setUser({ ...userCredential.user, displayName: cleanNick });
      } else {
        throw err;
      }
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, authenticate, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

