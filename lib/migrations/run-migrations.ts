#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { supabaseAdmin } from '../supabase/tenant-client';

interface Migration {
  version: number;
  name: string;
  filename: string;
  sql: string;
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = join(__dirname);
  
  const migrations: Migration[] = [
    {
      version: 1,
      name: 'Create Master Schema',
      filename: '001-create-master-schema.sql',
      sql: readFileSync(join(migrationsDir, '001-create-master-schema.sql'), 'utf8')
    }
  ];

  return migrations.sort((a, b) => a.version - b.version);
}

async function getCurrentVersion(): Promise<number> {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('valor')
      .eq('clave', 'schema_version')
      .single();

    if (error || !data) {
      console.log('📋 No schema version found, starting from 0');
      return 0;
    }

    return parseInt(data.valor as string) || 0;
  } catch (error) {
    console.log('📋 No schema version table found, starting from 0');
    return 0;
  }
}

async function setSchemaVersion(version: number): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available');
  }

  const { error } = await supabaseAdmin
    .from('system_config')
    .upsert({
      clave: 'schema_version',
      valor: version.toString(),
      descripcion: 'Current database schema version'
    });

  if (error) {
    throw new Error(`Failed to update schema version: ${error.message}`);
  }
}

async function executeMigration(migration: Migration): Promise<void> {
  console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);
  
  try {
    // For complex migrations, we might need to execute multiple statements
    const statements = migration.sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.includes('COMMENT ON') || statement.includes('DO $$')) {
        // Execute these as raw SQL
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client not available');
        }
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: statement 
        });
        if (error) {
          console.warn(`⚠️ Non-critical statement failed: ${error.message}`);
        }
      } else {
        // Execute other statements normally
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client not available');
        }
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: statement 
        });
        if (error) {
          throw error;
        }
      }
    }
    
    console.log(`✅ Migration ${migration.version} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${migration.version} failed:`, error);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...');
  console.log('');

  try {
    const migrations = await loadMigrations();
    const currentVersion = await getCurrentVersion();
    
    console.log(`📊 Current schema version: ${currentVersion}`);
    console.log(`📊 Latest migration version: ${migrations[migrations.length - 1]?.version || 0}`);
    console.log('');

    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Database is up to date. No migrations needed.');
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
    pendingMigrations.forEach(m => {
      console.log(`  - ${m.version}: ${m.name}`);
    });
    console.log('');

    for (const migration of pendingMigrations) {
      await executeMigration(migration);
      await setSchemaVersion(migration.version);
    }

    console.log('');
    console.log('🎉 All migrations completed successfully!');
    console.log(`📊 Database schema updated to version ${pendingMigrations[pendingMigrations.length - 1].version}`);

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

async function rollbackMigration(targetVersion: number): Promise<void> {
  console.log(`🔄 Rolling back to version ${targetVersion}...`);
  
  // This is a simplified rollback - in production you'd want proper rollback scripts
  console.warn('⚠️ Rollback functionality not implemented yet');
  console.warn('⚠️ Manual database restoration may be required');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'rollback':
      const version = parseInt(args[1]);
      if (isNaN(version)) {
        console.error('Usage: tsx run-migrations.ts rollback <version>');
        process.exit(1);
      }
      await rollbackMigration(version);
      break;
    
    case 'status':
      const currentVersion = await getCurrentVersion();
      const migrations = await loadMigrations();
      const latestVersion = migrations[migrations.length - 1]?.version || 0;
      
      console.log('📊 Migration Status:');
      console.log(`  Current: ${currentVersion}`);
      console.log(`  Latest: ${latestVersion}`);
      console.log(`  Status: ${currentVersion >= latestVersion ? '✅ Up to date' : '⚠️ Migrations pending'}`);
      break;
    
    default:
      await runMigrations();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}