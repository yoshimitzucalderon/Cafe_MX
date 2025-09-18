// Configuración de entorno centralizada
export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_VERCEL: process.env.VERCEL === '1',
} as const;

// Validación de configuración
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!ENV.SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!ENV.SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }

  // En servidor, verificar service key
  if (typeof window === 'undefined' && !ENV.SUPABASE_SERVICE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is not set (required for server-side operations)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Función para determinar si usar proxy
export function shouldUseProxy(): boolean {
  // En servidor, nunca usar proxy
  if (typeof window === 'undefined') {
    return false;
  }

  // En localhost, usar proxy para evitar CORS hasta que se configure SSL/CORS
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return true;
  }

  // Por defecto, no usar proxy
  return false;
}

// Función para obtener la URL de Supabase correcta
export function getSupabaseUrl(): string {
  if (shouldUseProxy() && typeof window !== 'undefined') {
    return `${window.location.origin}/api/supabase`;
  }
  return ENV.SUPABASE_URL;
}

// Log de configuración (solo en desarrollo)
if (ENV.IS_DEVELOPMENT && typeof window !== 'undefined') {
  console.log('🔧 Environment Configuration:', {
    isProduction: ENV.IS_PRODUCTION,
    isVercel: ENV.IS_VERCEL,
    shouldUseProxy: shouldUseProxy(),
    supabaseUrl: getSupabaseUrl(),
  });
}