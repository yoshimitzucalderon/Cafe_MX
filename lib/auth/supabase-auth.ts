import { supabaseFallbackClient } from '../supabase/client-fallback';

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
  private client = supabaseFallbackClient; // Cliente por defecto (proxy si está habilitado)
  private useMockAuth = false; // Usar autenticación real de Supabase

  async signUp(data: SignUpData) {
    try {
      // Usar Supabase real
      const { data: authData, error } = await this.client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ''}/auth/verify-email`,
          data: {
            full_name: data.options.data.full_name,
            business_name: data.options.data.business_name,
            phone: data.options.data.phone || null,
          }
        }
      });

      if (error) {
        console.error('🚨 Auth signup error:', error);
        // Detect Supabase "User already registered" case to allow caller to fallback to sign-in
        const message = (error as any)?.message || '';
        if (message.toLowerCase().includes('already registered')) {
          return { user: null, error: 'USER_ALREADY_REGISTERED' };
        }
        return { user: null, error: message || 'Signup failed' };
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
      console.log('🚀 Starting signIn process for:', data.email);

      // Add timeout and better error handling for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      console.log('📡 Making fetch request to /api/auth/login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📡 Fetch response received, status:', response.status, 'ok:', response.ok);

      if (!response.ok) {
        let message = 'Login failed';
        try {
          const contentType = response.headers.get('content-type') || '';
          console.log('📋 Response content-type:', contentType);

          if (contentType.includes('application/json')) {
            const err = await response.json();
            console.log('❌ Server error response:', err);
            message = err?.error || message;
          } else {
            const text = await response.text();
            console.log('❌ Server text response:', text);
            if (text) message = text;
          }
        } catch (parseError) {
          console.error('🚨 Error parsing server response:', parseError);
        }
        return { user: null, session: null, error: message };
      }

      console.log('✅ Response OK, parsing JSON...');
      const responseData = await response.json();
      console.log('📦 Response data received:', { hasUser: !!responseData.user, hasSession: !!responseData.session });

      const { user, session } = responseData;
      console.log('✅ User signed in successfully:', user?.email);

      // Persistir la sesión en el cliente de Supabase para activar onAuthStateChange
      if (session?.access_token && session?.refresh_token) {
        console.log('🔐 Setting session in Supabase client...');
        const { error: setError } = await this.client.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        if (setError) {
          console.error('🚨 Error setting Supabase session on client:', setError);
          return { user: null, session: null, error: setError.message };
        }
        console.log('✅ Session set in Supabase client successfully');
      } else {
        console.error('🚨 Missing tokens from server login response:', { hasAccessToken: !!session?.access_token, hasRefreshToken: !!session?.refresh_token });
        return { user: null, session: null, error: 'Missing tokens from login response' };
      }

      return { user, session, error: null };

    } catch (error) {
      console.error('🚨 Signin exception:', error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { user: null, session: null, error: 'Request timeout - server took too long to respond' };
        }
        if (error.message.includes('Failed to fetch')) {
          return { user: null, session: null, error: 'Network error - unable to connect to server. Check your internet connection.' };
        }
        return { user: null, session: null, error: error.message };
      }

      return {
        user: null,
        session: null,
        error: 'Unknown error during signin'
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