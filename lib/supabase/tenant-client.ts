import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Debug environment variables
console.log('🔍 Supabase Client Init - Environment Check:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('URL Value:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('Anon Key Value:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'UNDEFINED');
console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
console.log('Service Key Value:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...' : 'UNDEFINED');
console.log('Is Server:', typeof window === 'undefined');

if (typeof window === 'undefined') {
  // Server-side checks
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Server: Missing NEXT_PUBLIC_SUPABASE_URL');
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Server: Missing SUPABASE_SERVICE_ROLE_KEY');
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }
} else {
  // Client-side checks
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Client: Missing NEXT_PUBLIC_SUPABASE_URL - Authentication will not work');
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Client: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY - Authentication will not work');
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Validate environment variables before creating clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not set');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required but not set');
}

// Server-side admin client (only create if service key is available)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      db: { schema: 'public' }
    })
  : null;

// Fallback function to get admin client with runtime check
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should not be used on client side');
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey) {
    throw new Error('Supabase admin client is not available. Check SUPABASE_SERVICE_ROLE_KEY.');
  }

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not set');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
    db: { schema: 'public' }
  });
}

// Client-side client with improved session handling
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: { schema: 'public' },
  global: {
    headers: {
      'X-Client-Info': 'cafemx-client'
    }
  }
});

const clientCache = new Map<string, any>();

export function getClientSupabase(schemaName: string): any {
  if (!schemaName) {
    throw new Error('Schema name is required for tenant client');
  }
  
  if (!schemaName.startsWith('cliente_')) {
    throw new Error('Invalid schema name format. Must start with "cliente_"');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for tenant client access');
  }

  const cacheKey = `tenant_${schemaName}`;
  
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    db: { schema: schemaName },
    auth: { persistSession: false },
    global: {
      headers: {
        'X-Client-Schema': schemaName
      }
    }
  });

  clientCache.set(cacheKey, client);
  return client;
}

export function getUserSupabase(schemaName?: string): any {
  if (schemaName) {
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required for user client access');
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: schemaName },
      auth: { persistSession: true },
      global: {
        headers: {
          'X-Client-Schema': schemaName
        }
      }
    });
  }
  
  return supabaseClient;
}

export interface ClientInfo {
  id: string;
  nombre_negocio: string;
  slug: string;
  schema_name: string;
  activo: boolean;
  owner_email: string;
  plan: string;
  features: Record<string, any>;
  created_at: string;
  last_activity: string;
}

export interface UserClientAccess {
  cliente_id: string;
  schema_name: string;
  rol: 'owner' | 'admin' | 'empleado' | 'viewer';
  activo: boolean;
  cliente: ClientInfo;
}

export async function getClientBySlug(slug: string): Promise<ClientInfo | null> {
  try {
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from('clientes')
      .select('*')
      .eq('slug', slug)
      .eq('activo', true)
      .single();

    if (error) {
      console.error('Error fetching client by slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in getClientBySlug:', error);
    return null;
  }
}

export async function getUserClients(userId: string): Promise<UserClientAccess[]> {
  try {
    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from('clientes_usuarios')
      .select(`
        cliente_id,
        schema_name,
        rol,
        activo,
        cliente:clientes!inner(*)
      `)
      .eq('user_id', userId)
      .eq('activo', true)
      .eq('cliente.activo', true);

    if (error) {
      console.error('Error fetching user clients:', error);
      return [];
    }

    return data as any;
  } catch (error) {
    console.error('Exception in getUserClients:', error);
    return [];
  }
}

// Client-side function to fetch user clients via API
export async function getUserClientsClient(accessToken: string): Promise<UserClientAccess[]> {
  try {
    const response = await fetch('/api/user/clients', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Error fetching user clients:', response.statusText);
      return [];
    }

    const { clients } = await response.json();
    return clients || [];

  } catch (error) {
    console.error('Exception in getUserClientsClient:', error);
    return [];
  }
}

export async function validateClientAccess(
  authHeader: string | null,
  clientSlug: string,
  requiredRole: 'owner' | 'admin' | 'empleado' | 'viewer' = 'empleado'
): Promise<{
  isValid: boolean;
  userId?: string;
  userRole?: string;
  schemaName?: string;
  error?: string;
}> {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    
    const admin = getSupabaseAdmin();

    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    
    if (authError || !user) {
      return { isValid: false, error: 'Invalid or expired token' };
    }

    const client = await getClientBySlug(clientSlug);
    if (!client) {
      return { isValid: false, error: 'Client not found or inactive' };
    }

    const { data: accessData, error: accessError } = await admin
      .from('clientes_usuarios')
      .select('rol, schema_name')
      .eq('user_id', user.id)
      .eq('cliente_id', client.id)
      .eq('activo', true)
      .single();

    if (accessError || !accessData) {
      return { isValid: false, error: 'User does not have access to this client' };
    }

    const roleHierarchy = {
      'viewer': 1,
      'empleado': 2,
      'admin': 3,
      'owner': 4
    };

    const userLevel = roleHierarchy[accessData.rol as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return { 
        isValid: false, 
        error: `Insufficient permissions. Required: ${requiredRole}, User has: ${accessData.rol}` 
      };
    }

    return {
      isValid: true,
      userId: user.id,
      userRole: accessData.rol,
      schemaName: accessData.schema_name
    };

  } catch (error) {
    console.error('Exception in validateClientAccess:', error);
    return { isValid: false, error: 'Internal server error during access validation' };
  }
}

export async function createTenantClient({
  nombre_negocio,
  slug,
  owner_email,
  owner_user_id,
  rfc,
  plan = 'basic'
}: {
  nombre_negocio: string;
  slug: string;
  owner_email: string;
  owner_user_id: string;
  rfc?: string;
  plan?: string;
}): Promise<{ success: boolean; client?: ClientInfo; error?: string }> {
  try {
    if (!slug.match(/^[a-z0-9-]+$/)) {
      return { success: false, error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.' };
    }

    const schema_name = `cliente_${slug.replace(/-/g, '_')}`;

    const existingClient = await getClientBySlug(slug);
    if (existingClient) {
      return { success: false, error: 'Client slug already exists' };
    }

    const admin = getSupabaseAdmin();

    const { data: existingSchema } = await admin
      .from('clientes')
      .select('schema_name')
      .eq('schema_name', schema_name)
      .single();

    if (existingSchema) {
      return { success: false, error: 'Schema name already exists' };
    }

    const { data: newClient, error: clientError } = await admin
      .from('clientes')
      .insert({
        nombre_negocio,
        slug,
        owner_email,
        rfc,
        plan,
        schema_name,
        activo: true,
        features: getDefaultFeatures(plan),
        max_usuarios: plan === 'basic' ? 5 : 20,
        max_tickets_mes: plan === 'basic' ? 500 : 2000
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      return { success: false, error: 'Failed to create client record' };
    }

    const { error: userAccessError } = await admin
      .from('clientes_usuarios')
      .insert({
        user_id: owner_user_id,
        cliente_id: newClient.id,
        schema_name: newClient.schema_name,
        rol: 'owner',
        activo: true
      });

    if (userAccessError) {
      console.error('Error creating user access:', userAccessError);

      await admin
        .from('clientes')
        .delete()
        .eq('id', newClient.id);

      return { success: false, error: 'Failed to assign owner access' };
    }

    // Create schema only on server side
    // TODO: Temporarily disabled schema creation until exec_sql function is available
    if (typeof window === 'undefined') {
      console.log(`⚠️  Schema creation skipped for ${schema_name} - exec_sql function not available`);
      // const { createClientSchema } = await import('./schema-manager');
      // await createClientSchema(schema_name);
    }

    return { success: true, client: newClient };

  } catch (error) {
    console.error('Exception in createClient:', error);
    return { success: false, error: 'Unexpected error during client creation' };
  }
}


function getDefaultFeatures(plan: string): Record<string, any> {
  const baseFeatures = {
    ocr_processing: true,
    basic_pos: true,
    inventory_management: true,
    basic_reports: true
  };

  if (plan === 'premium') {
    return {
      ...baseFeatures,
      advanced_analytics: true,
      bulk_export: true,
      api_access: true,
      custom_categories: true,
      multi_location: true
    };
  }

  return baseFeatures;
}

export async function getClientStats(schemaName: string): Promise<{
  totalTickets: number;
  processedTickets: number;
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  monthlyRevenue: number;
}> {
  try {
    const client = getClientSupabase(schemaName);
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const [ticketsResult, productsResult, salesResult] = await Promise.all([
      client.from('tickets').select('id, status'),
      client.from('productos').select('id, activo'),
      client.from('ventas').select('total, fecha').gte('fecha', monthStart.toISOString())
    ]);

    const totalTickets = ticketsResult.data?.length || 0;
    const processedTickets = ticketsResult.data?.filter((t: any) => t.status === 'processed').length || 0;
    const totalProducts = productsResult.data?.length || 0;
    const activeProducts = productsResult.data?.filter((p: any) => p.activo).length || 0;
    const totalSales = salesResult.data?.length || 0;
    const monthlyRevenue = salesResult.data?.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0) || 0;

    return {
      totalTickets,
      processedTickets,
      totalProducts,
      activeProducts,
      totalSales,
      monthlyRevenue
    };
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return {
      totalTickets: 0,
      processedTickets: 0,
      totalProducts: 0,
      activeProducts: 0,
      totalSales: 0,
      monthlyRevenue: 0
    };
  }
}

export { createClient as SupabaseClient } from '@supabase/supabase-js';