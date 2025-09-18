import { NextRequest, NextResponse } from 'next/server';

// Mock auth service para desarrollo mientras se configura el servicio real
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Simular respuesta de auth exitosa
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      aud: 'authenticated',
      role: 'authenticated',
      email: email,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        full_name: email.split('@')[0],
        business_name: 'Test Business'
      },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Generar mock session
    const mockSession = {
      access_token: 'mock-access-token-' + Date.now(),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token-' + Date.now(),
      user: mockUser
    };

    console.log('🔐 Mock auth: User registered/logged in:', email);

    return NextResponse.json({
      user: mockUser,
      session: mockSession
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Mock auth error:', error);
    return NextResponse.json(
      { error: 'Mock auth error', message: 'Error in mock authentication' },
      { status: 500 }
    );
  }
}

// Settings endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    external: {
      google: false,
      github: false,
      facebook: false
    },
    disable_signup: false,
    mailer_autoconfirm: true,
    sms_autoconfirm: false,
    phone_autoconfirm: false,
    webhook_retries: 3
  });
}