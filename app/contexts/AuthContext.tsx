// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { User, DUMMY_USERS, DUMMY_KEBUN } from '../types/auth';
// import { router } from 'expo-router';

// interface AuthContextType {
//   user: User | null;
//   kebun: any | null;
//   login: (email: string, password: string) => Promise<boolean>;
//   logout: () => void;
//   isAuthenticated: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [kebun, setKebun] = useState<any | null>(null);

//   useEffect(() => {
//     // Load user data from storage jika ada
//     // Untuk sekarang, kita skip karena ini demo
//   }, []);

//   const login = async (email: string, password: string): Promise<boolean> => {
//     // Simulasi API call
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     const foundUser = DUMMY_USERS.find(
//       u => u.email === email && u.password_hash === password
//     );
    
//     if (foundUser) {
//       setUser(foundUser);
      
//       // Cari data kebun yang sesuai
//       const userKebun = DUMMY_KEBUN.find(k => k.id_kebun === foundUser.id_kebun);
//       setKebun(userKebun || null);
      
//       return true;
//     }
//     return false;
//   };

//   const logout = () => {
//     setUser(null);
//     setKebun(null);
//     router.replace('/login');
//   };

//   return (
//     <AuthContext.Provider value={{
//       user,
//       kebun,
//       login,
//       logout,
//       isAuthenticated: !!user,
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, DUMMY_KEBUN } from '../types/auth';
import { router } from 'expo-router';
import { appConfig } from '../services/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  kebun: any | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@nutricomm_user';
const KEBUN_STORAGE_KEY = '@nutricomm_kebun';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [kebun, setKebun] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from storage saat app start
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      setIsLoading(true);
      const [storedUser, storedKebun] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(KEBUN_STORAGE_KEY)
      ]);

      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('[Auth] Loaded user from storage:', userData.email);
      }

      if (storedKebun) {
        const kebunData = JSON.parse(storedKebun);
        setKebun(kebunData);
        console.log('[Auth] Loaded kebun from storage:', kebunData.nama_kebun);
      }
    } catch (error) {
      console.error('[Auth] Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToStorage = async (userData: User, kebunData: any) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData)),
        AsyncStorage.setItem(KEBUN_STORAGE_KEY, JSON.stringify(kebunData))
      ]);
      console.log('[Auth] Saved user data to storage');
    } catch (error) {
      console.error('[Auth] Error saving to storage:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_STORAGE_KEY),
        AsyncStorage.removeItem(KEBUN_STORAGE_KEY)
      ]);
      console.log('[Auth] Cleared storage');
    } catch (error) {
      console.error('[Auth] Error clearing storage:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Call backend API
      const backendUrl = appConfig.getBackendUrl();
      console.log(`[Auth] Attempting login to: ${backendUrl}/api/user/login`);
      
      const response = await fetch(`${backendUrl}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      console.log('[Auth] Login response:', result);

      if (response.ok && result.success && result.user) {
        // Map backend user to frontend User interface
        const backendUser = result.user;
        const mappedUser: User = {
          id_user: backendUser._id,
          nama: backendUser.nama,
          email: backendUser.email,
          password_hash: '', // Don't store password
          id_kebun: backendUser.kebun_id || 'KBG001',
          nomor_keluarga: backendUser.nomor_keluarga || 1,
        };

        setUser(mappedUser);

        // Cari data kebun yang sesuai (masih dari dummy untuk sementara)
        const userKebun = DUMMY_KEBUN.find(k => k.id_kebun === mappedUser.id_kebun);
        setKebun(userKebun || null);

        // Save to storage
        await saveToStorage(mappedUser, userKebun || null);

        console.log('[Auth] Login successful:', mappedUser.nama);
        return true;
      } else {
        console.error('[Auth] Login failed:', result.error || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setKebun(null);
    await clearStorage();
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      kebun,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}