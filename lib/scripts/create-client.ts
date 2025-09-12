#!/usr/bin/env tsx

import { createTenantClient } from '../supabase/tenant-client';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.error('Usage: tsx create-client.ts <business_name> <slug> <owner_email> <owner_user_id> [rfc] [plan]');
    console.error('');
    console.error('Example:');
    console.error('  tsx create-client.ts "Café Central" cafe-central admin@cafecentral.com uuid-here RFC123456789 basic');
    process.exit(1);
  }

  const [nombre_negocio, slug, owner_email, owner_user_id, rfc, plan] = args;

  console.log('🚀 Creating new client...');
  console.log(`Business: ${nombre_negocio}`);
  console.log(`Slug: ${slug}`);
  console.log(`Owner: ${owner_email}`);
  console.log(`Plan: ${plan || 'basic'}`);
  console.log('');

  try {
    const result = await createTenantClient({
      nombre_negocio,
      slug,
      owner_email,
      owner_user_id,
      rfc: rfc || undefined,
      plan: plan || 'basic'
    });

    if (result.success && result.client) {
      console.log('✅ Client created successfully!');
      console.log('');
      console.log('Client Details:');
      console.log(`  ID: ${result.client.id}`);
      console.log(`  Business: ${result.client.nombre_negocio}`);
      console.log(`  Slug: ${result.client.slug}`);
      console.log(`  Schema: ${result.client.schema_name}`);
      console.log(`  Plan: ${result.client.plan}`);
      console.log('');
      console.log('Access URLs:');
      console.log(`  Dashboard: https://${slug}.ycm360.com/dashboard`);
      console.log(`  Local Dev: http://${slug}.localhost:3000/dashboard`);
      console.log('');
      console.log('Next Steps:');
      console.log('1. Test the dashboard access');
      console.log('2. Configure client settings');
      console.log('3. Add team members if needed');
    } else {
      console.error('❌ Failed to create client:');
      console.error(`  Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}