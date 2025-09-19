import { supabaseFallbackClient, getConfiguredSupabaseClient } from '../supabase/client-fallback';

export type AuthUser = {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    business_name?: string;
    phone?: string;
  };
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
};

export type SignUpData = {
  email: string;
  password: string;
  options: {
    data: {
      full_name: string;
      business_name: string;
      phone?: string;
    };
  };
};

export type SignInData = {
  email: string;
  password: string;
};

export class SupabaseAuthService {
  private client = supabaseFallbackClient; // Usar cliente directo sin proxy
  private useMockAuth = false; // Usar autenticación real de Supabase

  async signUp(data: SignUpData) {
    try {
      // Usar Supabase real
      const { data: authData, error } = await this.client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.options.data.full_name,
            business_name: data.options.data.business_name,
            phone: data.options.data.phone || null,
          }
        }
      });

      if (error) {
        console.error('🚨 Auth signup error:', error);
        return { user: null, error: error.message };
      }

      if (!authData.user) {
        return { user: null, error: 'No user data returned' };
      }

      console.log('✅ User signed up successfully:', authData.user.email);
      return { user: authData.user, error: null };

    } catch (error) {
      console.error('🚨 Signup exception:', error);
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error during signup'
      };
    }
  }

  async signIn(data: SignInData) {
    try {
      const { data: authData, error } = await this.client.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('🚨 Auth signin error:', error);
        return { user: null, session: null, error: error.message };
      }

      console.log('✅ User signed in successfully:', authData.user?.email);
      return { 
        user: authData.user, 
        session: authData.session, 
        error: null 
      };

    } catch (error) {
      console.error('🚨 Signin exception:', error);
      return { 
        user: null, 
        session: null,
        error: error instanceof Error ? error.message : 'Unknown error during signin' 
      };
    }
  }

  async signOut() {
    try {
      const { error } = await this.client.auth.signOut();
      
      if (error) {
        console.error('🚨 Auth signout error:', error);
        return { error: error.message };
      }

      console.log('✅ User signed out successfully');
      return { error: null };

    } catch (error) {
      console.error('🚨 Signout exception:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error during signout' 
      };
    }
  }

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      
      if (error) {
        console.error('🚨 Get session error:', error);
        return { session: null, error: error.message };
      }

      return { session, error: null };

    } catch (error) {
      console.error('🚨 Get session exception:', error);
      return { 
        session: null,
        error: error instanceof Error ? error.message : 'Unknown error getting session' 
      };
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.client.auth.getUser();
      
      if (error) {
        console.error('🚨 Get user error:', error);
        return { user: null, error: error.message };
      }

      return { user, error: null };

    } catch (error) {
      console.error('🚨 Get user exception:', error);
      return { 
        user: null,
        error: error instanceof Error ? error.message : 'Unknown error getting user' 
      };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      });

      if (error) {
        console.error('🚨 Password reset error:', error);
        return { error: error.message };
      }

      console.log('✅ Password reset email sent to:', email);
      return { error: null };

    } catch (error) {
      console.error('🚨 Password reset exception:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error during password reset' 
      };
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authService = new SupabaseAuthService();