import { NextRequest, NextResponse } from 'next/server';
import { getUserClients } from '@/lib/supabase/tenant-client';
import { getSupabaseAdmin } from '@/lib/supabase/tenant-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token using admin client
    const admin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user clients using the admin client (server-side)
    const clients = await getUserClients(user.id);

    return NextResponse.json({ clients });

  } catch (error) {
    console.error('Error in /api/user/clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}