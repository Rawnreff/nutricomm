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
import { User, DUMMY_USERS, DUMMY_KEBUN } from '../types/auth';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  kebun: any | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [kebun, setKebun] = useState<any | null>(null);

  useEffect(() => {
    // Load user data from storage jika ada
    // Untuk sekarang, kita skip karena ini demo
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulasi API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = DUMMY_USERS.find(
      u => u.email === email && u.password_hash === password
    );
    
    if (foundUser) {
      setUser(foundUser);
      
      // Cari data kebun yang sesuai
      const userKebun = DUMMY_KEBUN.find(k => k.id_kebun === foundUser.id_kebun);
      setKebun(userKebun || null);
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setKebun(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      kebun,
      login,
      logout,
      isAuthenticated: !!user,
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