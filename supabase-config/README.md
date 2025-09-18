# Configuración de Supabase Self-Hosted para CafeMX

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- Servidor con al menos 2GB de RAM
- Dominio configurado (supabase.ycm360.com)
- Certificado SSL (para HTTPS)

## 🚀 Instalación Rápida

### 1. Configuración Inicial

```bash
# Navegar al directorio de configuración
cd supabase-config

# Hacer el script ejecutable
chmod +x setup.sh

# Ejecutar el script de setup
./setup.sh
```

### 2. Configurar Variables de Entorno

Edita el archivo `.env` creado y actualiza:

```env
# Credenciales SMTP para emails
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-aplicacion
SMTP_ADMIN_EMAIL=admin@ycm360.com

# URL de tu sitio
GOTRUE_SITE_URL=https://supabase.ycm360.com
```

### 3. Iniciar Servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps

# Ver logs
docker-compose logs -f
```

## 🔧 Configuración del Servidor Web

### Opción A: Nginx (Recomendado)

1. Copia `nginx.conf` a tu directorio de nginx:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/supabase.ycm360.com
sudo ln -s /etc/nginx/sites-available/supabase.ycm360.com /etc/nginx/sites-enabled/
```

2. Configura SSL:
```bash
# Con Certbot (Let's Encrypt)
sudo certbot --nginx -d supabase.ycm360.com

# O copia tus certificados a:
/etc/nginx/ssl/supabase.ycm360.com.crt
/etc/nginx/ssl/supabase.ycm360.com.key
```

3. Reinicia Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Opción B: Kong API Gateway

Kong ya está incluido en el docker-compose y se configura automáticamente con `kong.yml`.

## 🔍 Verificación

### Test de Auth Service

```bash
# Verificar health
curl https://supabase.ycm360.com/auth/v1/health

# Test de signup
curl -X POST https://supabase.ycm360.com/auth/v1/signup \
  -H "Content-Type: application/json" \
  -H "apikey: tu-anon-key" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test de REST API

```bash
curl https://supabase.ycm360.com/rest/v1/ \
  -H "apikey: tu-anon-key"
```

## 📝 Actualizar tu Aplicación Next.js

En tu archivo `.env.local` de CafeMX:

```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛠️ Solución de Problemas

### Auth service no responde

1. Verifica logs:
```bash
docker-compose logs auth
```

2. Verifica que la base de datos tenga el schema auth:
```bash
docker-compose exec db psql -U postgres -c "\dn"
```

3. Reinicia el servicio:
```bash
docker-compose restart auth
```

### CORS errors

Asegúrate de que tu dominio esté en `GOTRUE_URI_ALLOW_LIST`:
```env
GOTRUE_URI_ALLOW_LIST=https://ycm360.com,http://localhost:3000
```

### Emails no se envían

1. Verifica credenciales SMTP
2. Para Gmail, usa una contraseña de aplicación
3. Revisa logs: `docker-compose logs auth | grep -i email`

## 📊 Monitoreo

```bash
# Ver uso de recursos
docker stats

# Health checks
curl https://supabase.ycm360.com/auth/v1/health
curl https://supabase.ycm360.com/rest/v1/
curl https://supabase.ycm360.com/storage/v1/status
```

## 🔐 Seguridad

1. **Cambia el JWT_SECRET** en producción
2. **Usa HTTPS siempre**
3. **Configura firewall** para permitir solo los puertos necesarios
4. **Actualiza regularmente** las imágenes de Docker

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs: `docker-compose logs [servicio]`
2. Verifica la conectividad: `docker-compose ps`
3. Asegúrate de que los puertos no estén bloqueados

## 📚 Estructura de Puertos

- **5432**: PostgreSQL (solo interno)
- **9999**: Auth Service (GoTrue)
- **3000**: REST API (PostgREST)
- **4000**: Realtime
- **5000**: Storage
- **8000**: Kong Gateway (entrada principal)
- **443**: HTTPS (nginx)