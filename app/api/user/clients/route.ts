import { NextRequest, NextResponse } from 'next/server';
import { getUserClients, getSupabaseAdmin } from '@/lib/supabase/tenant-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🚨 /api/user/clients: No auth header, returning empty clients');
      return NextResponse.json(
        { clients: [] },
        { status: 200 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Use server-side admin client to validate the JWT reliably (no proxy)
    const admin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);

    if (authError || !user) {
      console.log('🚨 /api/user/clients: Invalid token, returning empty clients');
      return NextResponse.json(
        { clients: [] },
        { status: 200 }
      );
    }

    const clients = await getUserClients(user.id);

    return NextResponse.json({ clients });

  } catch (error) {
    console.error('Error in /api/user/clients:', error);
    return NextResponse.json(
      { clients: [] },
      { status: 200 }
    );
  }
}