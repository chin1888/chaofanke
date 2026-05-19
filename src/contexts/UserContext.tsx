import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase/client';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const email = `${username}@meoo.local`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return false;
    }

    const userData = {
      id: data.user.id,
      username: data.user.user_metadata?.username || username,
      email: data.user.email || email,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('user_id', data.user.id);
    localStorage.setItem('username', data.user.user_metadata?.username || username);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
  }, []);

  const register = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const email = `${username}@meoo.local`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        email
      });
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'user'
      });
    }

    return { success: true };
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoggedIn: !!user, login, logout, register }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
