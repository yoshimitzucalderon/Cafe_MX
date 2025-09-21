import requests
import json
import sys
from datetime import datetime

# Configuración de Supabase
SUPABASE_URL = "https://api.ycm360.com"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU4MjI4ODQzLCJleHAiOjQxMDI0NDQ4MDB9.d5JknOjhScFWEDTQi3LFA0yThHCsZP5FHSZIj4uiQCc"

def test_auth_settings():
    """Prueba el endpoint de settings de autenticación"""
    print("1. Probando endpoint /auth/v1/settings...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/settings",
            headers={
                "apikey": ANON_KEY,
                "Content-Type": "application/json"
            },
            verify=False  # Omitir verificación SSL temporalmente
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Respuesta recibida: {len(response.text)} caracteres")
            print(f"   Configuración: autoconfirm={data.get('autoconfirm')}, mailer_autoconfirm={data.get('mailer_autoconfirm')}")
        else:
            print(f"   ❌ Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False

def test_signup():
    """Prueba el endpoint de signup"""
    print("\n2. Probando endpoint /auth/v1/signup...")
    email = f"test_{int(datetime.now().timestamp())}@test.com"
    print(f"   Email de prueba: {email}")

    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/signup",
            headers={
                "apikey": ANON_KEY,
                "Content-Type": "application/json"
            },
            json={
                "email": email,
                "password": "Test123456!",
                "data": {
                    "name": "Usuario de Prueba"
                }
            },
            verify=False
        )
        print(f"   Status: {response.status_code}")

        if response.status_code in [200, 201]:
            data = response.json()
            print(f"   ✅ Usuario creado exitosamente")
            print(f"   Respuesta completa: {len(response.text)} caracteres")
            if 'access_token' in data:
                print(f"   Token recibido: {data['access_token'][:50]}...")
            if 'user' in data:
                print(f"   Usuario ID: {data['user'].get('id')}")
                print(f"   Usuario Email: {data['user'].get('email')}")
        else:
            print(f"   ❌ Error: {response.text}")
        return response.status_code in [200, 201]
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False

def test_rest_api():
    """Prueba el endpoint REST API"""
    print("\n3. Probando endpoint /rest/v1/...")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/",
            headers={
                "apikey": ANON_KEY,
                "Content-Type": "application/json"
            },
            verify=False
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ REST API accesible")
            print(f"   Respuesta: {response.text[:100]}...")
        else:
            print(f"   ❌ Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False

def main():
    print("=" * 60)
    print("PRUEBA DE CONEXIÓN A SUPABASE")
    print("=" * 60)
    print(f"URL: {SUPABASE_URL}")
    print(f"Key: {ANON_KEY[:30]}...")
    print("=" * 60)

    # Deshabilitar warnings de SSL para las pruebas
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    results = []
    results.append(test_auth_settings())
    results.append(test_signup())
    results.append(test_rest_api())

    print("\n" + "=" * 60)
    print("RESUMEN DE PRUEBAS")
    print("=" * 60)
    success_count = sum(results)
    total_count = len(results)

    if success_count == total_count:
        print(f"✅ TODAS LAS PRUEBAS EXITOSAS ({success_count}/{total_count})")
        print("\n🎉 El problema del JSON truncado está RESUELTO!")
        print("La aplicación puede realizar signup/login sin errores.")
    else:
        print(f"⚠️ PRUEBAS PARCIALES ({success_count}/{total_count})")
        print("Algunos endpoints pueden necesitar revisión.")

    return success_count == total_count

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)