import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, getUserSupabase } from '../../../../lib/supabase/tenant-client';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      isServer: typeof window === 'undefined'
    };

    // Test admin client initialization
    let adminClientTest = null;
    try {
      const admin = getSupabaseAdmin();
      adminClientTest = { success: true, message: 'Admin client initialized successfully' };
    } catch (error) {
      adminClientTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test database connection
    let dbTest = null;
    try {
      const admin = getSupabaseAdmin();
      const { data, error, count } = await admin
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      if (error) {
        dbTest = { success: false, error: error.message };
      } else {
        dbTest = { success: true, message: 'Database connection successful', count: count || 0 };
      }
    } catch (error) {
      dbTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test client table structure
    let tableTest = null;
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from('clientes')
        .select('id, nombre_negocio, slug, schema_name')
        .limit(1);

      if (error) {
        tableTest = { success: false, error: error.message };
      } else {
        tableTest = { success: true, message: 'Clientes table accessible', sampleCount: data?.length || 0 };
      }
    } catch (error) {
      tableTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      adminClient: adminClientTest,
      database: dbTest,
      clientesTable: tableTest
    });

  } catch (error) {
    console.error('🚨 Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error in debug endpoint',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}