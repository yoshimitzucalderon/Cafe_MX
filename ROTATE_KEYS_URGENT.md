# ⚠️ URGENTE: Rotar Claves de Supabase

## Claves Comprometidas
Las siguientes claves fueron expuestas en el historial de Git y DEBEN ser rotadas:

### Service Role Key Expuesta
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTgyMjg4NDMsImV4cCI6NDEwMjQ0NDgwMH0.msT1BsBQ9-ewpMDFcVvPQn_xltJtxl35mihha2F-Dzs
```

## Pasos para Rotar las Claves

### 1. Conecta al servidor
```bash
ssh root@tu-servidor
```

### 2. Detén los servicios
```bash
cd /opt/supabase/supabase/docker
docker compose down
```

### 3. Genera nuevo JWT Secret
```bash
# Genera un nuevo JWT secret de 32 caracteres
openssl rand -base64 32
```

### 4. Actualiza el archivo .env
```bash
# Edita el archivo .env con el nuevo JWT_SECRET
nano .env

# Cambia:
JWT_SECRET=tu_nuevo_jwt_secret_aqui
```

### 5. Regenera las claves con el nuevo secret
```bash
# Instala el CLI de Supabase si no lo tienes
npm install -g supabase

# Genera nuevas claves
supabase keys generate --jwt-secret=tu_nuevo_jwt_secret_aqui
```

### 6. Actualiza Kong y Auth con las nuevas claves
```bash
# Actualiza las variables de entorno en docker-compose.yml
# ANON_KEY=nueva_anon_key
# SERVICE_ROLE_KEY=nueva_service_role_key
```

### 7. Reinicia los servicios
```bash
docker compose up -d
```

### 8. Actualiza el frontend
```bash
# Actualiza .env.local con las nuevas claves
NEXT_PUBLIC_SUPABASE_ANON_KEY=nueva_anon_key
SUPABASE_SERVICE_ROLE_KEY=nueva_service_role_key
```

### 9. Limpia el historial de Git
```bash
# Usa BFG Repo-Cleaner para eliminar las claves del historial
java -jar bfg.jar --replace-text passwords.txt repo.git
git push --force
```

## Verificación
```bash
# Test con las nuevas claves
curl -X GET "https://api.ycm360.com/auth/v1/settings" \
  -H "apikey: NUEVA_ANON_KEY"
```

## Prevención Futura
1. Nunca commitees archivos .env con credenciales reales
2. Usa un gestor de secretos (HashiCorp Vault, AWS Secrets Manager)
3. Configura git-secrets o gitleaks como pre-commit hooks
4. Rota las claves periódicamente

## Contacto de Emergencia
Si detectas actividad sospechosa, revisa los logs inmediatamente:
```bash
docker logs supabase-kong
docker logs supabase-auth
```