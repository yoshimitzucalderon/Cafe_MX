import { NextRequest, NextResponse } from 'next/server';

// Simple proxy to Supabase to avoid CORS issues in the browser during local/dev usage

const SUPABASE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function handleProxy(request: NextRequest) {
  if (!SUPABASE_BASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: 'Supabase environment not configured' },
      { status: 500 }
    );
  }

  const { pathname, search } = new URL(request.url);
  // Strip the "/api/supabase" prefix
  const upstreamPath = pathname.replace(/^\/api\/supabase\/?/, '');
  const targetUrl = `${SUPABASE_BASE_URL.replace(/\/$/, '')}/${upstreamPath}${search}`;

  const headers = new Headers(request.headers);
  // Ensure apikey header is present for Supabase
  headers.set('apikey', SUPABASE_ANON_KEY);
  headers.set('X-Client-Info', 'cafemx-proxy');
  // Do not forward host header
  headers.delete('host');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl, init);

  const responseHeaders = new Headers(upstream.headers);
  // CORS for local usage
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Client-Info',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  return handleProxy(request);
}

export async function POST(request: NextRequest) {
  return handleProxy(request);
}

export async function PUT(request: NextRequest) {
  return handleProxy(request);
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request);
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request);
}


