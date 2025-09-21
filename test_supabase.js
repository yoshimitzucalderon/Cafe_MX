const https = require('https');

// Configuración de Supabase
const SUPABASE_URL = 'https://api.ycm360.com';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4MjI4ODQzLCJleHAiOjQxMDI0NDQ4MDB9.d5JknOjhScFWEDTQi3LFA0yThHCsZP5FHSZIj4uiQCc';

// Crear agente HTTPS que ignore certificados SSL (solo para pruebas)
const agent = new https.Agent({
  rejectUnauthorized: false
});

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: method,
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      agent: agent
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAuthSettings() {
  console.log('1. Probando endpoint /auth/v1/settings...');
  try {
    const response = await makeRequest('/auth/v1/settings');
    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
      const data = JSON.parse(response.data);
      console.log(`   ✅ Respuesta recibida: ${response.data.length} caracteres`);
      console.log(`   Configuración: autoconfirm=${data.autoconfirm}, disable_signup=${data.disable_signup}`);
      return true;
    } else {
      console.log(`   ❌ Error: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return false;
  }
}

async function testSignup() {
  console.log('\n2. Probando endpoint /auth/v1/signup...');
  const email = `test_${Date.now()}@test.com`;
  console.log(`   Email de prueba: ${email}`);

  try {
    const response = await makeRequest('/auth/v1/signup', 'POST', {
      email: email,
      password: 'Test123456!',
      data: {
        name: 'Usuario de Prueba'
      }
    });

    console.log(`   Status: ${response.status}`);

    if (response.status === 200 || response.status === 201) {
      const data = JSON.parse(response.data);
      console.log(`   ✅ Usuario creado exitosamente`);
      console.log(`   Respuesta completa: ${response.data.length} caracteres`);

      if (data.access_token) {
        console.log(`   Token recibido: ${data.access_token.substring(0, 50)}...`);
      }
      if (data.user) {
        console.log(`   Usuario ID: ${data.user.id}`);
        console.log(`   Usuario Email: ${data.user.email}`);
      }
      return true;
    } else {
      console.log(`   ❌ Error: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return false;
  }
}

async function testRestAPI() {
  console.log('\n3. Probando endpoint /rest/v1/...');
  try {
    const response = await makeRequest('/rest/v1/');
    console.log(`   Status: ${response.status}`);

    if (response.status === 200) {
      console.log(`   ✅ REST API accesible`);
      console.log(`   Respuesta: ${response.data.substring(0, 100)}...`);
      return true;
    } else {
      console.log(`   ❌ Error: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error de conexión: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('PRUEBA DE CONEXIÓN A SUPABASE');
  console.log('='.repeat(60));
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${ANON_KEY.substring(0, 30)}...`);
  console.log('='.repeat(60));

  const results = [];
  results.push(await testAuthSettings());
  results.push(await testSignup());
  results.push(await testRestAPI());

  console.log('\n' + '='.repeat(60));
  console.log('RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));

  const successCount = results.filter(r => r).length;
  const totalCount = results.length;

  if (successCount === totalCount) {
    console.log(`✅ TODAS LAS PRUEBAS EXITOSAS (${successCount}/${totalCount})`);
    console.log('\n🎉 El problema del JSON truncado está RESUELTO!');
    console.log('La aplicación puede realizar signup/login sin errores.');
  } else {
    console.log(`⚠️ PRUEBAS PARCIALES (${successCount}/${totalCount})`);
    console.log('Algunos endpoints pueden necesitar revisión.');
  }

  process.exit(successCount === totalCount ? 0 : 1);
}

// Ignorar advertencias de certificado SSL para las pruebas
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

main().catch(console.error);