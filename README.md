# CafeMX - Multi-Tenant SaaS para Cafeterías

Sistema de gestión multi-tenant diseñado específicamente para cafeterías mexicanas, con OCR automático de tickets usando Anthropic Claude 3.5 Vision.

## 🎯 Características Principales

### ✅ **Multi-Tenant con Aislamiento Completo**
- **Schema-por-cliente**: Cada cafetería tiene su propio esquema de base de datos
- **Subdominios**: `{cafeteria}.ycm360.com` 
- **Datos aislados**: Zero data leaks entre clientes
- **Escalabilidad**: Hasta 50+ cafeterías independientes

### ✅ **OCR Inteligente con Anthropic**
- **API de Claude 3.5 Vision**: Reemplaza LLMs locales
- **Precisión > 95%**: Optimizado para tickets mexicanos
- **Extracción automática**: RFC, montos, IVA, categorías
- **Costo eficiente**: ~$0.003 USD por ticket

### ✅ **Gestión Integral**
- **POS integrado**: Sistema de ventas completo
- **Inventario**: Control de stock con alertas
- **Reportes fiscales**: Cumplimiento automático
- **Dashboard**: Métricas en tiempo real

## 🏗️ Arquitectura

### Base de Datos Multi-Tenant
```
PostgreSQL (Supabase)
├── public (esquema maestro)
│   ├── clientes
│   ├── clientes_usuarios  
│   └── ocr_usage
├── cliente_cafe_central
│   ├── tickets
│   ├── productos
│   ├── ventas
│   └── configuracion
└── cliente_dulce_aroma
    ├── tickets
    ├── productos
    └── ...
```

### Stack Tecnológico
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase self-hosted
- **OCR**: Anthropic Claude 3.5 Vision API
- **Auth**: Supabase Auth con multi-tenant
- **UI**: Radix UI + shadcn/ui

## 🚀 Setup Rápido

### 1. Clonar e Instalar
```bash
git clone <repo>
cd CafeMX
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
# Supabase Self-hosted
NEXT_PUBLIC_SUPABASE_URL=https://supabase.ycm360.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic OCR
ANTHROPIC_API_KEY=your_actual_anthropic_api_key_here
```

### 3. Ejecutar Migraciones
```bash
npm run migrate
```

### 4. Crear Cliente de Prueba
```bash
npm run create-client "Café Central" cafe-central admin@cafecentral.com <user_uuid>
```

### 5. Iniciar Desarrollo
```bash
npm run dev
```

**Acceso**: http://cafe-central.localhost:3000/dashboard

## 📁 Estructura del Proyecto

```
cafemx/
├── app/
│   ├── [cafeteria]/          # Rutas por tenant
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── tickets/          # Gestión de tickets OCR
│   │   ├── productos/        # Inventario
│   │   ├── ventas/          # POS/Ventas
│   │   └── reportes/        # Analytics
│   ├── api/
│   │   ├── ocr/             # OCR con Anthropic
│   │   ├── clients/         # Gestión de clientes
│   │   └── auth/            # Autenticación
│   ├── (auth)/              # Páginas de auth
│   └── admin/               # Panel super admin
├── components/
│   ├── ui/                  # shadcn components
│   ├── dashboard/           # Componentes del dashboard
│   ├── tenant/              # Multi-tenant components
│   └── ocr/                 # Componentes OCR
├── lib/
│   ├── supabase/           # Cliente multi-tenant
│   ├── ocr-service.ts      # Servicio Anthropic OCR
│   ├── migrations/         # Migraciones SQL
│   └── utils.ts            # Utilidades
└── middleware.ts           # Routing por subdomain
```

## 🔧 Comandos Principales

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build para producción
npm run start           # Servidor de producción

# Base de datos
npm run migrate         # Ejecutar migraciones
npm run migrate status  # Estado de migraciones

# Clientes
npm run create-client <nombre> <slug> <email> <user_id>

# Calidad de código
npm run lint           # ESLint
npm run typecheck      # TypeScript check
```

## 🔐 Sistema Multi-Tenant

### Creación de Cliente
```typescript
import { createClient } from '@/lib/supabase/tenant-client';

const result = await createClient({
  nombre_negocio: "Café Central",
  slug: "cafe-central",
  owner_email: "admin@cafecentral.com", 
  owner_user_id: "uuid-here",
  rfc: "CAF123456789",
  plan: "basic"
});
```

### Acceso por Subdomain
- **Dashboard**: `cafe-central.ycm360.com/dashboard`
- **Tickets**: `cafe-central.ycm360.com/tickets`
- **API**: `cafe-central.ycm360.com/api/ocr/process`

### Aislamiento de Datos
```typescript
// Cada cliente tiene su propio cliente Supabase
const clientDB = getClientSupabase('cliente_cafe_central');

// Todas las queries son automáticamente aisladas
const tickets = await clientDB
  .from('tickets')
  .select('*'); // Solo tickets de este cliente
```

## 🤖 Integración OCR con Anthropic

### Procesar Ticket
```typescript
import { processTicketOCRWithRetry } from '@/lib/ocr-service';

const result = await processTicketOCRWithRetry(imageUrl);

// Resultado
{
  fecha: "2024-01-15",
  total: 450.00,
  subtotal: 387.93,
  iva: 62.07,
  rfc_emisor: "CAF123456789",
  concepto: "Café tostado premium",
  categoria: "insumos",
  confidence: 0.95,
  processing_time_ms: 2340
}
```

### API Endpoint
```bash
POST /api/ocr/process
Content-Type: application/json
Authorization: Bearer <token>

{
  "imageUrl": "https://...",
  "cafeteriaSlug": "cafe-central"
}
```

## 📊 Costos de Operación

### OCR con Anthropic Claude 3.5
- **Costo por ticket**: ~$0.003 USD
- **100 tickets/mes**: $0.30 USD por cliente
- **Para 10 clientes**: $3 USD/mes total OCR
- **ROI**: $199 MXN ($11 USD) - $0.30 OCR = $10.70 USD profit/cliente

### Comparativa de APIs
| Proveedor | Costo/ticket | Precisión | Español |
|-----------|--------------|-----------|---------|
| **Anthropic Claude 3.5** | **$0.003** | **95%+** | **Excelente** |
| OpenAI GPT-4V | $0.010 | 93% | Muy bueno |
| Google Vision | $0.004 | 88% | Bueno |

## 🔒 Seguridad

### Aislamiento por Cliente
- **Schema-level isolation**: Imposible acceso cruzado
- **Row Level Security**: Defensa adicional
- **JWT validation**: Por endpoint y cliente
- **Audit trails**: Por esquema

### Validación de Acceso
```typescript
const { isValid, schemaName } = await validateClientAccess(
  authHeader,
  'cafe-central',
  'empleado' // rol mínimo requerido
);
```

## 📈 Escalabilidad

### Métricas de Performance
- **Tiempo de respuesta OCR**: < 3 segundos
- **Clientes concurrentes**: 50+
- **Tickets por mes**: 25,000+
- **Uptime objetivo**: 99.9%

### Monitoreo
```typescript
// Stats por cliente
const stats = await getClientStats('cliente_cafe_central');
// => { totalTickets, processedTickets, monthlyRevenue, ... }
```

## 🚦 Roadmap

### ✅ Fase 1 - MVP Multi-Tenant (Actual)
- [x] Arquitectura multi-tenant
- [x] OCR con Anthropic
- [x] Dashboard básico
- [x] POS integrado

### 🔄 Fase 2 - Q1 2024
- [ ] Reportes avanzados
- [ ] Facturación automática
- [ ] Mobile app (PWA)
- [ ] Integraciones SAT

### 🔮 Fase 3 - Q2 2024
- [ ] IA para predicción de inventario
- [ ] Analytics avanzado
- [ ] API pública
- [ ] Marketplace de integraciones

## 🆘 Soporte

### Logs y Debugging
```bash
# Ver logs de OCR
tail -f logs/ocr.log

# Debug cliente específico
npm run debug-client cafe-central

# Verificar aislamiento
npm run test-isolation
```

### Contacto
- **Email**: contacto@ycm360.com
- **Docs**: https://docs.ycm360.com
- **Support**: https://support.ycm360.com

## 📄 Licencia

Propietario - YCM360 SaaS Platform

---

**CafeMX** - Gestión inteligente para cafeterías mexicanas 🇲🇽 ☕

## Environment variables

Create a `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```