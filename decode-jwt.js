// Cargar variables del .env.local
require('dotenv').config({ path: '.env.local' });

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format');
      return;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    console.log('Header:', JSON.stringify(header, null, 2));
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Check expiration
    if (payload.exp) {
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = now > expirationDate;

      console.log('Expiration:', expirationDate.toISOString());
      console.log('Current time:', now.toISOString());
      console.log('Is expired:', isExpired ? '❌ YES' : '✅ NO');

      if (!isExpired) {
        const timeLeft = expirationDate.getTime() - now.getTime();
        const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        console.log('Time left:', `${daysLeft} days`);
      }
    }
  } catch (error) {
    console.error('❌ Error decoding JWT:', error.message);
  }
}

console.log('🔍 Analyzing JWT tokens from .env.local\n');

console.log('=== ANON KEY ===');
decodeJWT(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

console.log('\n=== SERVICE ROLE KEY ===');
decodeJWT(process.env.SUPABASE_SERVICE_ROLE_KEY);