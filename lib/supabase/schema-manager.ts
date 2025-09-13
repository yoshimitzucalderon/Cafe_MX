// Server-side only schema management utilities
// This file is separated to avoid client-side bundle issues with fs module

import { supabaseAdmin } from './tenant-client';

export async function createClientSchema(schemaName: string): Promise<void> {
  try {
    // This function should only be called on the server side
    if (typeof window !== 'undefined') {
      throw new Error('createClientSchema can only be called on the server side');
    }

    const fs = await import('fs');
    const path = await import('path');
    
    const templatePath = path.join(process.cwd(), 'lib', 'migrations', '002-client-schema-template.sql');
    let sqlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    const schemaSafe = schemaName.replace(/[^a-zA-Z0-9_]/g, '_');
    
    sqlTemplate = sqlTemplate.replace(/{SCHEMA}/g, schemaName);
    sqlTemplate = sqlTemplate.replace(/{SCHEMA_SAFE}/g, schemaSafe);
    
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not available. Check SUPABASE_SERVICE_ROLE_KEY.');
    }
    
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: sqlTemplate });
    
    if (error) {
      console.error('Error creating client schema:', error);
      throw new Error(`Failed to create schema ${schemaName}: ${error.message}`);
    }
    
    console.log(`✅ Client schema ${schemaName} created successfully`);
    
  } catch (error) {
    console.error('Exception in createClientSchema:', error);
    throw error;
  }
}