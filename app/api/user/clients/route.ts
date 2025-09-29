import { NextRequest, NextResponse } from 'next/server';
import { mockDB, parseJWT } from '../../../../lib/mock-database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/user/clients - Request received (LOCAL DEV MODE)');

    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🚨 /api/user/clients: No auth header, returning empty clients');
      return NextResponse.json({ clients: [] });
    }

    const token = authHeader.replace('Bearer ', '');

    // Parse JWT token
    let user;
    try {
      const payload = parseJWT(token);

      // Check token expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('🚨 /api/user/clients: Token expired, returning empty clients');
        return NextResponse.json({ clients: [] });
      }

      user = { id: payload.sub, email: payload.email };
      console.log('✅ User authenticated:', user.email);
    } catch (error) {
      console.log('🚨 /api/user/clients: Invalid token, returning empty clients');
      return NextResponse.json({ clients: [] });
    }

    // Find all clients for this user
    const userClients = mockDB.getUserClients(user.id);

    console.log('✅ Found', userClients.length, 'clients for user:', user.email);

    return NextResponse.json({ clients: userClients });

  } catch (error) {
    console.error('🚨 /api/user/clients error (LOCAL DEV MODE):', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error fetching user clients',
        clients: []
      },
      { status: 500 }
    );
  }
}