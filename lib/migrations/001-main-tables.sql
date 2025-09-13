-- =============================================================================
-- CafeMX Multi-Tenant: Main Database Tables
-- Version: 001
-- Description: Creates the main tables for the multi-tenant system
-- =============================================================================

-- =============================================================================
-- EXTENSIONS AND HELPER FUNCTIONS
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create timezone-aware now function
CREATE OR REPLACE FUNCTION public.tz_now()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT now() AT TIME ZONE 'America/Mexico_City';
$$;

-- =============================================================================
-- MAIN TABLES
-- =============================================================================

-- Clients (Tenants) - Each cafeteria is a client/tenant
CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_negocio varchar(100) NOT NULL,
    slug varchar(50) NOT NULL UNIQUE,
    owner_email varchar(255) NOT NULL,
    rfc varchar(13),
    plan varchar(20) NOT NULL DEFAULT 'basic',
    schema_name varchar(100) NOT NULL UNIQUE,
    activo boolean DEFAULT true,
    features jsonb DEFAULT '{}',
    max_usuarios integer DEFAULT 5,
    max_tickets_mes integer DEFAULT 500,
    created_at timestamptz DEFAULT tz_now(),
    updated_at timestamptz DEFAULT tz_now(),
    last_activity timestamptz DEFAULT tz_now(),

    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_schema_name CHECK (schema_name ~ '^cliente_[a-z0-9_]+$'),
    CONSTRAINT valid_plan CHECK (plan IN ('basic', 'premium', 'enterprise')),
    CONSTRAINT valid_rfc CHECK (rfc IS NULL OR rfc ~ '^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$')
);

-- Client-User Access Control
CREATE TABLE IF NOT EXISTS public.clientes_usuarios (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL, -- References auth.users
    cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    schema_name varchar(100) NOT NULL,
    rol varchar(20) NOT NULL DEFAULT 'empleado',
    activo boolean DEFAULT true,
    invited_by uuid, -- References auth.users
    invited_at timestamptz,
    accepted_at timestamptz,
    created_at timestamptz DEFAULT tz_now(),
    updated_at timestamptz DEFAULT tz_now(),

    CONSTRAINT valid_rol CHECK (rol IN ('owner', 'admin', 'empleado', 'viewer')),
    CONSTRAINT unique_user_client UNIQUE (user_id, cliente_id)
);

-- Usage Tracking
CREATE TABLE IF NOT EXISTS public.uso_mensual (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    año integer NOT NULL,
    mes integer NOT NULL,
    tickets_procesados integer DEFAULT 0,
    usuarios_activos integer DEFAULT 0,
    almacenamiento_mb numeric(10,2) DEFAULT 0,
    api_calls integer DEFAULT 0,
    created_at timestamptz DEFAULT tz_now(),
    updated_at timestamptz DEFAULT tz_now(),

    CONSTRAINT valid_año CHECK (año >= 2024 AND año <= 2099),
    CONSTRAINT valid_mes CHECK (mes >= 1 AND mes <= 12),
    CONSTRAINT unique_cliente_mes UNIQUE (cliente_id, año, mes)
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.configuracion_sistema (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave varchar(100) NOT NULL UNIQUE,
    valor jsonb NOT NULL,
    descripcion text,
    categoria varchar(50) DEFAULT 'general',
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT tz_now(),
    updated_at timestamptz DEFAULT tz_now(),

    CONSTRAINT valid_categoria CHECK (categoria IN ('general', 'ocr', 'storage', 'billing', 'security'))
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clientes_owner_email ON public.clientes(owner_email);
CREATE INDEX IF NOT EXISTS idx_clientes_slug ON public.clientes(slug) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_schema_name ON public.clientes(schema_name);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON public.clientes(activo);

-- Client-User access indexes
CREATE INDEX IF NOT EXISTS idx_clientes_usuarios_user_id ON public.clientes_usuarios(user_id) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_usuarios_cliente_id ON public.clientes_usuarios(cliente_id) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_usuarios_schema ON public.clientes_usuarios(schema_name);

-- Usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_uso_mensual_cliente ON public.uso_mensual(cliente_id, año, mes);
CREATE INDEX IF NOT EXISTS idx_uso_mensual_fecha ON public.uso_mensual(año, mes);

-- System settings indexes
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON public.configuracion_sistema(clave) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_configuracion_categoria ON public.configuracion_sistema(categoria) WHERE activo = true;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uso_mensual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = tz_now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_usuarios_updated_at
    BEFORE UPDATE ON public.clientes_usuarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_uso_mensual_updated_at
    BEFORE UPDATE ON public.uso_mensual
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracion_sistema_updated_at
    BEFORE UPDATE ON public.configuracion_sistema
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default system configuration
INSERT INTO public.configuracion_sistema (clave, valor, descripcion, categoria)
VALUES
    ('ocr_providers', '["anthropic", "openai", "google"]', 'Available OCR providers', 'ocr'),
    ('default_ocr_provider', '"anthropic"', 'Default OCR provider', 'ocr'),
    ('max_file_size_mb', '10', 'Maximum file size for uploads in MB', 'storage'),
    ('allowed_file_types', '["image/jpeg", "image/png", "image/webp", "application/pdf"]', 'Allowed file types for upload', 'storage'),
    ('basic_plan_limits', '{"max_usuarios": 5, "max_tickets_mes": 500, "storage_gb": 1}', 'Limits for basic plan', 'billing'),
    ('premium_plan_limits', '{"max_usuarios": 20, "max_tickets_mes": 2000, "storage_gb": 10}', 'Limits for premium plan', 'billing')
ON CONFLICT (clave) DO NOTHING;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.clientes IS 'Multi-tenant clients (cafeterías). Each client has its own schema.';
COMMENT ON TABLE public.clientes_usuarios IS 'User access control for clients. Maps users to clients with roles.';
COMMENT ON TABLE public.uso_mensual IS 'Monthly usage tracking for billing and limits.';
COMMENT ON TABLE public.configuracion_sistema IS 'System-wide configuration settings.';

COMMENT ON COLUMN public.clientes.slug IS 'URL-safe identifier for client, used in subdomains';
COMMENT ON COLUMN public.clientes.schema_name IS 'PostgreSQL schema name for client data isolation';
COMMENT ON COLUMN public.clientes_usuarios.rol IS 'User role: owner (full access), admin (manage users), empleado (daily ops), viewer (read-only)';

-- =============================================================================
-- COMPLETED
-- =============================================================================
SELECT 'Main tables migration completed successfully' as result;