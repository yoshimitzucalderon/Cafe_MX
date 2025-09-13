/**
 * Migration script to apply database changes
 * Usage: node scripts/migrate.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

async function runMigration() {
  console.log('🚀 Starting database migration...');

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
  }

  // Create admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  console.log('✅ Supabase admin client initialized');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'lib', 'migrations', '001-main-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📝 SQL length:', migrationSQL.length, 'characters');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('📊 Found', statements.length, 'SQL statements to execute');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comment-only statements
      if (statement.startsWith('/*') || statement.startsWith('COMMENT')) {
        console.log(`⏭️  Skipping comment statement ${i + 1}`);
        continue;
      }

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 100) + '...');

          // For some errors, we might want to continue (like "already exists")
          if (error.message.includes('already exists') ||
              error.message.includes('does not exist') ||
              error.message.includes('duplicate')) {
            console.log('⚠️  Continuing despite error (probably safe)...');
            continue;
          } else {
            throw error;
          }
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);

      } catch (statementError) {
        console.error(`🚨 Failed to execute statement ${i + 1}:`, statementError);
        console.error('Statement:', statement.substring(0, 200) + '...');
        throw statementError;
      }
    }

    console.log('🎉 Migration completed successfully!');

    // Verify tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['clientes', 'clientes_usuarios', 'uso_mensual', 'configuracion_sistema']);

    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError);
    } else {
      console.log('✅ Verified tables:', tables?.map(t => t.table_name) || []);
    }

  } catch (error) {
    console.error('🚨 Migration failed:', error);
    process.exit(1);
  }
}

// Handle alternative approach if exec_sql is not available
async function runMigrationDirect() {
  console.log('🔄 Trying direct execution approach...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Try to create the main table directly
  const createClientsTable = `
    CREATE TABLE IF NOT EXISTS public.clientes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nombre_negocio varchar(100) NOT NULL,
      slug varchar(50) NOT NULL UNIQUE,
      owner_email varchar(255) NOT NULL,
      rfc varchar(13),
      plan varchar(20) NOT NULL DEFAULT 'basic',
      schema_name varchar(100) NOT NULL UNIQUE,
      activo boolean DEFAULT true,
      features jsonb DEFAULT '{}',
      max_usuarios integer DEFAULT 5,
      max_tickets_mes integer DEFAULT 500,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      last_activity timestamptz DEFAULT now()
    );
  `;

  try {
    console.log('🔧 Creating clientes table...');
    const { error } = await supabase.rpc('exec_sql', { sql: createClientsTable });

    if (error) {
      console.error('❌ Direct table creation failed:', error);
      console.log('💡 You may need to run the SQL migration manually in Supabase dashboard');
      return;
    }

    console.log('✅ Clientes table created successfully');

  } catch (error) {
    console.error('🚨 Direct migration also failed:', error);
    console.log('');
    console.log('📋 Manual migration required:');
    console.log('1. Go to Supabase dashboard > SQL Editor');
    console.log('2. Copy and run the content of lib/migrations/001-main-tables.sql');
    console.log('3. Or create the tables manually');
  }
}

// Run migration
runMigration().catch(async (error) => {
  console.log('');
  console.log('⚠️  Primary migration approach failed, trying alternative...');
  await runMigrationDirect();
});