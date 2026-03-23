import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInAnonymously,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticate: (nick: string, discord: string) => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Basic Firebase Auth State
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // 2. Check for Discord OAuth Implicit Grant tokens
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        // Clear the hash from the URL so it looks clean
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        
        // Fetch User profile from Discord
        fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
        .then(res => res.json())
        .then(async (discordUser) => {
          if (!discordUser.id) throw new Error("Falha ao obter dados do Discord.");
          
          // Sign in to Firebase Anonymously to gain database access rules
          const credential = await signInAnonymously(auth);
          
          const avatarUrl = discordUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null;
            
          await updateProfile(credential.user, {
            displayName: discordUser.username,
            photoURL: avatarUrl
          });
          
          setUser({ ...credential.user, displayName: discordUser.username, photoURL: avatarUrl } as User);
        })
        .catch(err => {
          console.error("Failed to authenticate with Discord", err);
          alert("Erro ao conectar com o Discord.");
        });
      }
    }

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
      // Success: User exists and password (Discord) matches
      if (userCredential.user.displayName !== cleanNick) {
        await updateProfile(userCredential.user, { displayName: cleanNick });
        window.location.reload();
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Obvious case: Create new
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: cleanNick });
        window.location.reload();
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        // Obfuscated case or actual wrong password.
        // Try creating to see if it's new.
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: cleanNick });
          window.location.reload();
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            // It really is taken and password didn't match
            throw new Error("Este Nick já está em uso por outro Treinador (Discord divergente).");
          }
          throw createErr;
        }
      } else {
        throw err;
      }
    }
  };

  const loginWithDiscord = async () => {
    // We use Discord Implicit Grant to bypass Firebase Identity Platform limitations.
    const clientId = '1484668729165086881'; // From the user's application
    const redirectUri = encodeURIComponent(window.location.origin);
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=identify`;
    
    // Redirect top level window to Discord
    window.location.href = discordAuthUrl;
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Failed to authenticate with Google", err);
      throw err;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, authenticate, loginWithDiscord, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

