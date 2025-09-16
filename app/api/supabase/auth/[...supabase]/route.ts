import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: { supabase: string[] } }
) {
  return handleSupabaseProxy(request, params.supabase);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { supabase: string[] } }
) {
  return handleSupabaseProxy(request, params.supabase);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { supabase: string[] } }
) {
  return handleSupabaseProxy(request, params.supabase);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { supabase: string[] } }
) {
  return handleSupabaseProxy(request, params.supabase);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { supabase: string[] } }
) {
  return handleSupabaseProxy(request, params.supabase);
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { supabase: string[] } }
) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey, X-Client-Info',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function handleSupabaseProxy(
  request: NextRequest,
  pathSegments: string[]
) {
  try {
    if (!SUPABASE_URL) {
      return NextResponse.json(
        { error: 'Supabase URL not configured' },
        { status: 500 }
      );
    }

    // Construir la URL correcta para Supabase
    const path = pathSegments.join('/');
    const url = new URL(request.url);

    // Para auth endpoints, usar el path completo
    let supabaseUrl: string;
    if (path.includes('token') || path.includes('signup') || path.includes('user') || path.includes('session')) {
      supabaseUrl = `${SUPABASE_URL}/auth/v1/${path}${url.search}`;
    } else {
      // Para otros endpoints
      supabaseUrl = `${SUPABASE_URL}/${path}${url.search}`;
    }

    console.log('🔄 Proxying to:', supabaseUrl);
    console.log('📦 Method:', request.method);

    const headers: Record<string, string> = {};

    // Copy relevant headers
    const relevantHeaders = [
      'authorization',
      'content-type',
      'apikey',
      'x-client-info',
      'x-client-schema'
    ];

    relevantHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    // Add default apikey if not present
    if (!headers.apikey && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      headers.apikey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }

    console.log('🔑 Headers:', JSON.stringify(headers, null, 2));

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Add body for non-GET requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch (error) {
        console.warn('⚠️ Could not read request body:', error);
      }
    }

    const response = await fetch(supabaseUrl, fetchOptions);

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    return new NextResponse(
      typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
      {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey, X-Client-Info',
        },
      }
    );

  } catch (error) {
    console.error('❌ Supabase proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy error', details: error instanceof Error ? error.message : String(error) },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey, X-Client-Info',
        }
      }
    );
  }
}