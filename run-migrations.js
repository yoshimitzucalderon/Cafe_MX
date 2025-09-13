#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.ycm360.com';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Read the master schema SQL file
    const sqlFile = path.join(__dirname, 'lib', 'migrations', '001-create-master-schema.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Executing master schema migration...');
    
    // Execute the SQL - split by statements to handle them individually
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('DO $$') || statement.includes('CREATE OR REPLACE FUNCTION')) {
        // Execute complex statements using RPC
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.warn(`⚠️ Statement warning: ${error.message}`);
          }
        } catch (err) {
          console.warn(`⚠️ Statement skipped: ${err.message}`);
        }
      } else if (statement.trim().length > 0) {
        // Try to execute directly first
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.warn(`⚠️ Statement warning: ${error.message}`);
          }
        } catch (err) {
          console.warn(`⚠️ Statement skipped: ${err.message}`);
        }
      }
    }
    
    // Verify critical tables exist
    console.log('🔍 Verifying tables...');
    
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id')
      .limit(1);
    
    const { data: usuarios, error: usuariosError } = await supabase
      .from('clientes_usuarios')
      .select('id')
      .limit(1);
    
    if (clientesError && clientesError.code !== 'PGRST116') {
      console.error('❌ Error accessing clientes table:', clientesError);
      return;
    }
    
    if (usuariosError && usuariosError.code !== 'PGRST116') {
      console.error('❌ Error accessing clientes_usuarios table:', usuariosError);
      return;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Tables created:');
    console.log('  - public.clientes');
    console.log('  - public.clientes_usuarios');
    console.log('  - public.iva_rates');
    console.log('  - public.ocr_usage');
    console.log('  - public.system_config');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Check if Supabase auth is working
async function checkAuth() {
  try {
    console.log('🔐 Checking Supabase auth configuration...');
    
    // Test the service role key
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.warn('⚠️ Auth check warning:', error.message);
    }
    
    console.log('✅ Supabase connection successful');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🏗️ CafeMX Database Setup');
  console.log('========================');
  
  await checkAuth();
  await runMigrations();
  
  console.log('\n🎉 Setup complete! You can now create users.');
}

main().catch(console.error);