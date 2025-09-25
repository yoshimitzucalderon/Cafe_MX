import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENV, getSupabaseUrl, shouldUseProxy } from '../config/environment';

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

console.log('🔧 Fallback client configuration:');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('Key:', supabaseAnonKey ? '✅' : '❌');
console.log('Should use proxy:', shouldUseProxy());

// Cliente con configuración mejorada para evitar CORS
const createSupabaseClient = () => {
  const clientUrl = getSupabaseUrl();

  console.log(`🔧 Creating Supabase client with URL: ${clientUrl}`);
  console.log(`🔄 Using proxy: ${shouldUseProxy()}`);

  return createClient(clientUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-fallback',
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'cafemx-fallback',
      }
    }
  });
};

export const supabaseFallbackClient = createSupabaseClient();

// Direct client (bypasses proxy) to be used for critical auth flows when proxy is flaky
export function getDirectSupabaseClient() {
  const clientUrl = ENV.SUPABASE_URL;
  return createClient(clientUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-direct',
    },
    db: { schema: 'public' },
    global: {
      headers: {
        'X-Client-Info': 'cafemx-direct',
      }
    }
  });
}

// Función para testear la conexión
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  method: 'direct' | 'proxy' | 'failed';
}> {
  try {
    console.log('🧪 Testing Supabase connection...');

    // Primero intentar conexión directa
    try {
      const { data, error } = await supabaseFallbackClient.auth.getSession();
      if (!error) {
        console.log('✅ Direct connection successful');
        return { success: true, method: 'direct' };
      }
    } catch (directError) {
      console.log('⚠️ Direct connection failed, trying alternatives...');
    }

    // Si estamos en el cliente, intentar con el proxy
    if (typeof window !== 'undefined') {
      try {
        const proxyClient = createClient(
          `${window.location.origin}/api/supabase`,
          supabaseAnonKey,
          {
            auth: { persistSession: false }
          }
        );

        const { data, error } = await proxyClient.auth.getSession();
        if (!error) {
          console.log('✅ Proxy connection successful');
          return { success: true, method: 'proxy' };
        }
      } catch (proxyError) {
        console.log('⚠️ Proxy connection also failed');
      }
    }

    return {
      success: false,
      method: 'failed',
      error: 'All connection methods failed'
    };

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return {
      success: false,
      method: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Re-export for convenience
export default supabaseFallbackClient;

// Función auxiliar para obtener un cliente con configuración específica
export function getConfiguredSupabaseClient(forceProxy = false) {
  if (forceProxy && typeof window !== 'undefined') {
    console.log('🔄 Creating forced proxy client');
    console.log('📍 Proxy URL:', `${window.location.origin}/api/supabase`);

    // Use proxy URL that will forward to actual Supabase
    const proxyUrl = `${window.location.origin}/api/supabase`;

    return createClient(
      proxyUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: window.localStorage,
          storageKey: 'sb-auth-proxy',
        },
        db: { schema: 'public' },
        global: {
          headers: {
            'X-Client-Info': 'cafemx-proxy',
            'apikey': supabaseAnonKey,
          }
        }
      }
    );
  }

  return supabaseFallbackClient;
}

// Función para verificar conectividad
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabaseFallbackClient.auth.getSession();
    return !error;
  } catch {
    return false;
  }
}