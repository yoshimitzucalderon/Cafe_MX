const { createClient } = require('@supabase/supabase-js');

// Cargar variables del .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testConnection() {
  console.log('🔍 Testing Supabase Connection');
  console.log('URL:', supabaseUrl);
  console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NOT SET');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing credentials in .env.local');
    return;
  }

  const admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: {
        apikey: supabaseServiceKey
      }
    }
  });

  try {
    // Test 1: Check available tables with correct name
    console.log('\n🧪 Testing database connection (checking clientes table)...');
    const { data: clientsData, error: clientsError } = await admin
      .from('clientes')
      .select('count')
      .limit(1);

    if (clientsError) {
      console.log('❌ Clientes table error:', clientsError.message);
      console.log('Error details:', JSON.stringify(clientsError, null, 2));
    } else {
      console.log('✅ Database connection successful - clientes table exists');
    }

    // Test 2: Check clientes_usuarios table
    console.log('\n🧪 Testing clientes_usuarios table...');
    const { data: usersData, error: usersError } = await admin
      .from('clientes_usuarios')
      .select('count')
      .limit(1);

    if (usersError) {
      console.log('❌ Clientes_usuarios table error:', usersError.message);
    } else {
      console.log('✅ Clientes_usuarios table exists');
    }

    // Test 3: Auth validation with dummy token (should fail)
    console.log('\n🧪 Testing auth validation with dummy token...');
    const { data: authData, error: authError } = await admin.auth.getUser('dummy_invalid_token');

    if (authError) {
      console.log('✅ Auth validation working (correctly rejected invalid token):', authError.message);
    } else {
      console.log('⚠️ Auth validation unexpected success with dummy token');
    }

    // Test 4: Health check
    console.log('\n🧪 Testing Supabase health...');
    try {
      const response = await fetch(`${supabaseUrl}/health`);
      console.log('Health check status:', response.status);
      if (response.ok) {
        console.log('✅ Supabase server is healthy');
      } else {
        console.log('⚠️ Supabase server health check failed');
      }
    } catch (healthError) {
      console.log('❌ Health check failed:', healthError.message);
    }

  } catch (err) {
    console.error('🚨 Connection test failed:', err.message);
    console.error('Full error:', err);
  }
}

testConnection();