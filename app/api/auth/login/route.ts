import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log('Login endpoint called');

  try {
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Supabase URL configured:', !!supabaseUrl);
    console.log('Supabase Key configured:', !!supabaseAnonKey);
    console.log('Supabase URL:', supabaseUrl);

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Supabase environment is not configured' },
        { status: 500 }
      );
    }

    // Create Supabase client with better error handling
    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      db: { schema: 'public' },
      global: {
        headers: {
          apikey: supabaseAnonKey
        }
      }
    });

    console.log('Attempting sign in with Supabase...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase auth error:', error);
      console.error('Error code:', error.code);
      console.error('Error status:', error.status);

      // Handle specific error cases
      if (error.message?.includes('Invalid login credentials')) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: error.message || 'Authentication failed',
          code: error.code,
          status: error.status
        },
        { status: error.status || 401 }
      );
    }

    if (!data?.session) {
      console.error('No session returned from Supabase');
      return NextResponse.json(
        { error: 'Authentication failed - no session created' },
        { status: 401 }
      );
    }

    console.log('Login successful for user:', data.user?.email);
    const { session, user } = data;

    // Return success response
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at
      }
    });

  } catch (error) {
    console.error('Login endpoint error:', error);

    // Check if error is due to invalid JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error during login',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}