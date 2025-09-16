import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 Fallback client configuration:');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('Key:', supabaseAnonKey ? '✅' : '❌');

// Cliente con configuración mejorada para evitar CORS
export const supabaseFallbackClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Configuración más permisiva para CORS
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'cafemx-fallback',
      'Access-Control-Allow-Origin': '*',
    },
    fetch: async (url, options = {}) => {
      // Custom fetch con manejo de CORS mejorado
      const customOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, apikey, X-Client-Info',
        },
        mode: 'cors' as RequestMode,
        credentials: 'omit' as RequestCredentials,
      };

      console.log('🌐 Fallback fetch to:', url);

      try {
        const response = await fetch(url, customOptions);
        console.log('📡 Response status:', response.status);
        return response;
      } catch (error) {
        console.error('❌ Fallback fetch error:', error);

        // Si falla, intentar con proxy local
        if (typeof window !== 'undefined' && url.toString().includes(supabaseUrl)) {
          const proxyUrl = url.toString().replace(supabaseUrl, `${window.location.origin}/api/supabase`);
          console.log('🔄 Trying proxy URL:', proxyUrl);

          try {
            return await fetch(proxyUrl, customOptions);
          } catch (proxyError) {
            console.error('❌ Proxy fetch also failed:', proxyError);
            throw error; // Throw original error
          }
        }

        throw error;
      }
    }
  }
});

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

export default supabaseFallbackClient;