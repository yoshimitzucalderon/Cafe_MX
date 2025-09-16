# 🚀 Guía de Despliegue en Vercel

## ⚙️ Variables de Entorno Requeridas

Asegúrate de configurar estas variables en el dashboard de Vercel:

### Variables Públicas (Client-side)
```env
NEXT_PUBLIC_SUPABASE_URL=https://supabase.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### Variables Privadas (Server-side)
```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_key_aqui
ANTHROPIC_API_KEY=tu_anthropic_key_aqui
```

## 🔧 Configuración de CORS en Supabase

### Opción 1: Dashboard de Supabase (Recomendado)

1. Ve a tu dashboard de Supabase en `https://supabase.ycm360.com`
2. Navega a **Settings → API**
3. En la sección **CORS Configuration**, agrega:
   - `https://*.vercel.app` (para todos los deployments de Vercel)
   - `https://tu-dominio-personalizado.com` (si tienes uno)
   - `http://localhost:3000` (para desarrollo local)

### Opción 2: Usar el Proxy Incluido

Si no puedes modificar la configuración CORS de Supabase, la aplicación incluye un proxy automático que se activa en Vercel:

- El proxy intercepta todas las llamadas a Supabase
- Ruta: `/api/supabase/auth/[...supabase]`
- Se activa automáticamente cuando detecta el dominio `vercel.app`

## 📝 Pasos de Despliegue

1. **Conecta tu repositorio con Vercel**
   ```bash
   vercel
   ```

2. **Configura las variables de entorno** en el dashboard de Vercel:
   - Ve a Settings → Environment Variables
   - Agrega todas las variables listadas arriba

3. **Verifica el despliegue**
   - Ve a `https://tu-app.vercel.app/test-connection`
   - Deberías ver "Conexión exitosa"

## 🐛 Solución de Problemas

### Error: CORS Policy
**Síntoma:** `has been blocked by CORS policy`

**Solución:**
1. Verifica que las URLs en Supabase CORS incluyan tu dominio de Vercel
2. Si no puedes modificar CORS, el proxy debería activarse automáticamente
3. Revisa los logs en Vercel para confirmar que el proxy está funcionando

### Error: Invalid API Key
**Síntoma:** `Invalid API key` o `JWT malformed`

**Solución:**
1. Verifica que las keys en Vercel coincidan exactamente con las de Supabase
2. Asegúrate de que no haya espacios o caracteres invisibles
3. Regenera las keys si es necesario

### Error: 404 en rutas del proxy
**Síntoma:** Proxy devuelve 404

**Solución:**
1. Verifica que el archivo `app/api/supabase/auth/[...supabase]/route.ts` existe
2. Revisa los logs de Vercel para ver la URL exacta que se está llamando
3. Asegúrate de que Next.js esté en versión 14+ para soporte de route handlers

## 🔍 Monitoreo

Para monitorear el estado del proxy y las conexiones:

1. **Logs de Vercel:**
   - Ve a Functions → Logs en el dashboard de Vercel
   - Filtra por `/api/supabase`

2. **Página de Test:**
   - Visita `/test-connection` después de cada despliegue
   - Verifica que muestre "Método: proxy" cuando uses Vercel

3. **Browser Console:**
   - Abre la consola del navegador
   - Busca mensajes que empiecen con 🔧, 🔄, o ❌

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en Vercel Dashboard
2. Verifica la configuración CORS en Supabase
3. Asegúrate de que todas las variables de entorno estén configuradas
4. Prueba localmente con `npm run dev` para aislar el problema