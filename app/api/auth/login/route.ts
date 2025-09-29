import { NextRequest, NextResponse } from 'next/server';

// Mock user database for development
const MOCK_USERS = {
  'ycalderonmozqueda@gmail.com': {
    id: '1acd4474-1af8-4551-b578-b781451ecc1f',
    email: 'ycalderonmozqueda@gmail.com',
    password_hash: 'mock_hash', // In production, this would be properly hashed
    user_metadata: {
      full_name: 'Jorge Baristi Z',
      business_name: 'Café Baristi YC',
      phone: '+52 1 55 1234 5678'
    },
    app_metadata: {}
  },
  'yoshimitzu.calderon@gmail.com': {
    id: '2bcd4474-2af8-4551-b578-b781451ecc2f',
    email: 'yoshimitzu.calderon@gmail.com',
    password_hash: 'mock_hash',
    user_metadata: {
      full_name: 'Yoshimitzu Calderon',
      business_name: 'Café Demo',
      phone: '+52 1 55 9876 5432'
    },
    app_metadata: {}
  }
};

function generateMockJWT(user: any): string {
  const toB64Url = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');

  const jwtHeader = toB64Url({ alg: 'HS256', typ: 'JWT' });
  const jwtPayload = toB64Url({
    sub: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
    app_metadata: user.app_metadata,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    iat: Math.floor(Date.now() / 1000),
    iss: 'cafemx-local'
  });
  const jwtSignature = 'localDevSignature';

  return `${jwtHeader}.${jwtPayload}.${jwtSignature}`;
}

export async function POST(request: NextRequest) {
  console.log('🔐 LOGIN ENDPOINT: Called');

  try {
    // Parse request body
    let email: string, password: string;
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.log('🔐 LOGIN ATTEMPT FOR:', email);
    console.log('🔑 Password provided:', password ? `${password.substring(0, 3)}***` : 'NO');

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists in mock database
    const user = MOCK_USERS[email as keyof typeof MOCK_USERS];

    if (!user) {
      console.log('❌ User not found in mock database:', email);
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials and try again.' },
        { status: 401 }
      );
    }

    // In production, you would verify password hash
    // For development, we accept any password
    console.log('✅ User found in mock database');

    // Generate mock session
    const accessToken = generateMockJWT(user);
    const refreshToken = `refresh_${Date.now()}_${user.id}`;
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours

    console.log('✅ LOGIN SUCCESSFUL (LOCAL DEV MODE)');
    console.log('👤 User ID:', user.id);
    console.log('📧 User Email:', user.email);
    console.log('🎫 Session expires at:', expiresAt);

    // Return successful response
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      },
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 86400, // 24 hours
        expires_at: expiresAt,
        token_type: 'bearer'
      }
    });

  } catch (error) {
    console.error('💥 UNHANDLED ERROR IN LOGIN ENDPOINT:');
    console.error('   - Error type:', error?.constructor?.name);
    console.error('   - Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('   - Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format - malformed JSON' },
        { status: 400 }
      );
    }

    if (error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Server configuration error - invalid environment setup' },
        { status: 500 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        error: 'Internal server error during authentication',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}