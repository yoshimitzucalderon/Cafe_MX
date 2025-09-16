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

    const path = pathSegments.join('/');
    const url = new URL(request.url);
    const supabaseUrl = `${SUPABASE_URL}/auth/v1/${path}${url.search}`;

    console.log('🔄 Proxying to:', supabaseUrl);

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