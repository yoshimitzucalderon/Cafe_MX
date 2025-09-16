import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Cliente que usa el proxy para evitar CORS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// URL del proxy (cuando estamos en el cliente)
const getProxyUrl = () => {
  if (typeof window !== 'undefined') {
    // En el cliente, usar el proxy para evitar CORS
    const origin = window.location.origin;
    console.log('🔄 Using Supabase proxy:', `${origin}/api/supabase`);
    return `${origin}/api/supabase`;
  }
  // En el servidor, usar la URL directa
  console.log('🔗 Using direct Supabase URL:', supabaseUrl);
  return supabaseUrl;
};

export const supabaseClientWithProxy = createClient(
  getProxyUrl(),
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    db: { schema: 'public' },
    global: {
      headers: {
        'X-Client-Info': 'cafemx-client-proxy'
      }
    }
  }
);

// Función para alternar entre cliente directo y proxy
export function getSupabaseClient(useProxy = true): SupabaseClient {
  if (useProxy && typeof window !== 'undefined') {
    return supabaseClientWithProxy;
  }

  // Fallback al cliente directo
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    db: { schema: 'public' }
  });
}

export default supabaseClientWithProxy;