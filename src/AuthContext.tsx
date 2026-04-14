import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';
import { supabase } from './lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session?.user) {
        const supabaseUser = session.user;
        // Fetch additional user data from Supabase 'profiles' table
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', supabaseUser.id)
            .single();

          if (profile && !error) {
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: profile.name || 'User',
              role: profile.role || 'student',
              department: profile.department || '',
              avatar: profile.avatar
            } as User);
          } else {
            // Profile doesn't exist yet, use basic info from metadata
            const meta = supabaseUser.user_metadata || {};
            setUser({
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: meta.full_name || meta.name || supabaseUser.email || 'New User',
              role: meta.role || 'student',
              department: meta.department || ''
            } as User);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('gs_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('gs_user');
      localStorage.removeItem('token');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
