// Debug environment variables
export function debugEnvVars() {
  console.log('Environment Variables Debug:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  console.log('Is Client Side:', typeof window !== 'undefined');
  
  if (typeof window === 'undefined') {
    console.log('Server-side env check completed');
  } else {
    console.log('Client-side env check completed');
  }
}