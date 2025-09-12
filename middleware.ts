import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  console.log(`🌐 Middleware processing: ${hostname}${url.pathname}`);

  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isVercelApp = hostname.includes('vercel.app');
  
  let subdomain: string | null = null;
  
  if (isLocalhost) {
    const subdomainMatch = hostname.match(/^([^.]+)\.localhost/);
    subdomain = subdomainMatch ? subdomainMatch[1] : null;
  } else if (!isVercelApp) {
    // Only treat as subdomain if it's not a Vercel deployment
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
    }
  }
  
  console.log(`🔍 Detected subdomain: ${subdomain || 'none'}`);

  if (subdomain && 
      subdomain !== 'www' && 
      subdomain !== 'ycm360' && 
      subdomain !== 'admin' &&
      !subdomain.startsWith('api')) {
    
    console.log(`🏢 Routing to tenant: ${subdomain}`);
    
    if (url.pathname.startsWith('/api/')) {
      console.log(`📡 API request for tenant: ${subdomain}`);
      url.pathname = `/api${url.pathname}`;
      request.headers.set('x-tenant-slug', subdomain);
      return NextResponse.rewrite(url, { request });
    }
    
    if (url.pathname === '/') {
      console.log(`🏠 Redirecting to tenant dashboard: ${subdomain}`);
      url.pathname = `/${subdomain}/dashboard`;
      return NextResponse.rewrite(url);
    }
    
    if (!url.pathname.startsWith(`/${subdomain}`)) {
      console.log(`🔄 Rewriting path for tenant: ${subdomain}`);
      url.pathname = `/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (subdomain === 'admin') {
    console.log(`👑 Admin subdomain detected`);
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (!subdomain || subdomain === 'www' || subdomain === 'ycm360') {
    console.log(`🌍 Main domain routing`);
    
    if (url.pathname === '/') {
      return NextResponse.next();
    }
    
    if (url.pathname.startsWith('/auth') || 
        url.pathname.startsWith('/api') || 
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/favicon') ||
        url.pathname.includes('.')) {
      return NextResponse.next();
    }
  }

  if (url.pathname.startsWith('/api/')) {
    const tenantSlug = request.headers.get('x-tenant-slug') || subdomain;
    if (tenantSlug) {
      request.headers.set('x-tenant-slug', tenantSlug);
    }
  }

  console.log(`✅ Middleware completed for: ${hostname}${url.pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};