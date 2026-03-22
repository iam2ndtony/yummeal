'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logoutAction } from '@/actions/auth';

interface User {
  id: string;
  email: string;
  name?: string;
  plan?: string;
  kitchenGear?: string[];
  updatedAt?: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialSession }: { children: ReactNode; initialSession: User | null }) {
  const [user, setUser] = useState<User | null>(initialSession);
  const [isLoading, setIsLoading] = useState(!initialSession);

  useEffect(() => {
    if (!initialSession) {
      setIsLoading(false);
    }
  }, [initialSession]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutAction();
    } catch {
      // Fallback in case server action fails or redirect doesn't happen
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
