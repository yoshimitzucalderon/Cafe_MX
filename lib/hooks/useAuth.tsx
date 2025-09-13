'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService, AuthUser } from '../auth/supabase-auth';
import { getUserClientsClient, UserClientAccess } from '../supabase/tenant-client';

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  userClients: UserClientAccess[];
  loading: boolean;
  signUp: (email: string, password: string, userData: {
    full_name: string;
    business_name: string;
    phone?: string;
  }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshUserClients: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userClients, setUserClients] = useState<UserClientAccess[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to refresh user clients
  const refreshUserClients = async () => {
    if (!session?.access_token) {
      setUserClients([]);
      return;
    }

    try {
      const clients = await getUserClientsClient(session.access_token);
      setUserClients(clients);
      console.log(`✅ Loaded ${clients.length} client(s) for user:`, user?.email);
    } catch (error) {
      console.error('🚨 Error fetching user clients:', error);
      setUserClients([]);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { session: initialSession } = await authService.getCurrentSession();
        
        if (mounted) {
          if (initialSession?.user) {
            setUser(initialSession.user);
            setSession(initialSession);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('🚨 Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Clear or refresh user clients based on auth state
          if (event === 'SIGNED_OUT') {
            setUserClients([]);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh user clients when session changes
  useEffect(() => {
    if (session && !loading) {
      refreshUserClients();
    } else if (!session) {
      setUserClients([]);
    }
  }, [session, loading]);

  const signUp = async (
    email: string, 
    password: string, 
    userData: {
      full_name: string;
      business_name: string;
      phone?: string;
    }
  ) => {
    setLoading(true);
    
    try {
      const { error } = await authService.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      // Don't set loading to false here, let the auth state change handle it
      return { error: null };

    } catch (error) {
      setLoading(false);
      return { 
        error: error instanceof Error ? error.message : 'Unknown signup error' 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { error } = await authService.signIn({ email, password });

      if (error) {
        setLoading(false);
        return { error };
      }

      // Don't set loading to false here, let the auth state change handle it
      return { error: null };

    } catch (error) {
      setLoading(false);
      return { 
        error: error instanceof Error ? error.message : 'Unknown signin error' 
      };
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        setLoading(false);
        return { error };
      }

      // Clear state immediately
      setUser(null);
      setSession(null);
      setUserClients([]);
      setLoading(false);
      
      return { error: null };

    } catch (error) {
      setLoading(false);
      return { 
        error: error instanceof Error ? error.message : 'Unknown signout error' 
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await authService.resetPassword(email);
      return { error };
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Unknown password reset error' 
      };
    }
  };

  const value = {
    user,
    session,
    userClients,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshUserClients,
  };

  return (
    <AuthContext.Provider value={value}>
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