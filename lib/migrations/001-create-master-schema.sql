-- =============================================================================
-- CafeMX Multi-Tenant: Master Schema Creation
-- Version: 001
-- Description: Creates the master schema for multi-tenant architecture
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- GLOBAL UTILITY FUNCTIONS
-- =============================================================================

-- Timezone-aware now function for Mexico
CREATE OR REPLACE FUNCTION public.tz_now(tz text DEFAULT 'America/Mexico_City')
RETURNS timestamptz AS $$
BEGIN
    RETURN now() AT TIME ZONE tz;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate safe schema names
CREATE OR REPLACE FUNCTION public.generate_schema_name(business_name text)
RETURNS text AS $$
BEGIN
    RETURN 'cliente_' || lower(regexp_replace(
        unaccent(business_name), 
        '[^a-zA-Z0-9]', 
        '_', 
        'g'
    ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate RFC format
CREATE OR REPLACE FUNCTION public.validate_rfc(rfc text)
RETURNS boolean AS $$
BEGIN
    RETURN rfc ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- MASTER TABLES
-- =============================================================================

-- Main clients table
CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_negocio varchar(255) NOT NULL,
    slug varchar(100) UNIQUE NOT NULL,
    owner_email varchar(255) NOT NULL,
    rfc varchar(13),
    direccion text,
    telefono varchar(20),
    plan varchar(50) DEFAULT 'basic',
    activo boolean DEFAULT true,
    schema_name varchar(100) UNIQUE NOT NULL,
    schema_version integer DEFAULT 1,
    max_usuarios integer DEFAULT 5,
    max_tickets_mes integer DEFAULT 500,
    features jsonb DEFAULT '{}',
    billing_info jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    last_activity timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT valid_schema_name CHECK (schema_name ~ '^cliente_[a-z0-9_]+$'),
    CONSTRAINT valid_rfc CHECK (rfc IS NULL OR public.validate_rfc(rfc))
);

-- User access control per client
CREATE TABLE IF NOT EXISTS public.clientes_usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
    schema_name varchar(100) REFERENCES public.clientes(schema_name) ON DELETE CASCADE,
    rol varchar(20) DEFAULT 'empleado',
    activo boolean DEFAULT true,
    permisos jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    
    UNIQUE(user_id, cliente_id),
    CONSTRAINT valid_rol CHECK (rol IN ('owner', 'admin', 'empleado', 'viewer'))
);

-- Global reference tables
CREATE TABLE IF NOT EXISTS public.iva_rates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pais varchar(2) DEFAULT 'MX',
    rate decimal(5,4) NOT NULL DEFAULT 0.1600,
    activo boolean DEFAULT true,
    fecha_inicio date DEFAULT CURRENT_DATE,
    fecha_fin date,
    created_at timestamptz DEFAULT public.tz_now()
);

-- OCR API usage tracking
CREATE TABLE IF NOT EXISTS public.ocr_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
    mes date NOT NULL, -- First day of month
    total_requests integer DEFAULT 0,
    successful_requests integer DEFAULT 0,
    failed_requests integer DEFAULT 0,
    total_cost_usd decimal(10,4) DEFAULT 0,
    api_provider varchar(20) DEFAULT 'anthropic',
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    
    UNIQUE(cliente_id, mes, api_provider)
);

-- System configuration
CREATE TABLE IF NOT EXISTS public.system_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clave varchar(100) UNIQUE NOT NULL,
    valor jsonb,
    descripcion text,
    updated_at timestamptz DEFAULT public.tz_now()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_clientes_slug ON public.clientes(slug) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_schema_name ON public.clientes(schema_name) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_owner_email ON public.clientes(owner_email);
CREATE INDEX IF NOT EXISTS idx_clientes_last_activity ON public.clientes(last_activity);

CREATE INDEX IF NOT EXISTS idx_clientes_usuarios_user_id ON public.clientes_usuarios(user_id) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_clientes_usuarios_schema_name ON public.clientes_usuarios(schema_name) WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_ocr_usage_cliente_mes ON public.ocr_usage(cliente_id, mes);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_usage ENABLE ROW LEVEL SECURITY;

-- Policies for clientes table
CREATE POLICY "Users can read their own clients" ON public.clientes
    FOR SELECT USING (
        id IN (
            SELECT cliente_id FROM public.clientes_usuarios 
            WHERE user_id = auth.uid() AND activo = true
        )
    );

-- Policies for clientes_usuarios table
CREATE POLICY "Users can read their own access records" ON public.clientes_usuarios
    FOR SELECT USING (user_id = auth.uid());

-- Policies for OCR usage (owners and admins only)
CREATE POLICY "Owners can read OCR usage" ON public.ocr_usage
    FOR SELECT USING (
        cliente_id IN (
            SELECT cliente_id FROM public.clientes_usuarios 
            WHERE user_id = auth.uid() 
            AND rol IN ('owner', 'admin') 
            AND activo = true
        )
    );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get user's accessible schemas
CREATE OR REPLACE FUNCTION public.get_user_schemas(user_uuid uuid)
RETURNS TABLE(schema_name text, rol text, cliente_slug text) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cu.schema_name::text,
        cu.rol::text,
        c.slug::text
    FROM public.clientes_usuarios cu
    JOIN public.clientes c ON cu.cliente_id = c.id
    WHERE cu.user_id = user_uuid 
    AND cu.activo = true 
    AND c.activo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to a specific client
CREATE OR REPLACE FUNCTION public.user_has_client_access(
    user_uuid uuid, 
    client_slug text,
    required_role text DEFAULT 'empleado'
)
RETURNS boolean AS $$
DECLARE
    user_role text;
    role_hierarchy integer;
    required_hierarchy integer;
BEGIN
    -- Get user role for this client
    SELECT cu.rol INTO user_role
    FROM public.clientes_usuarios cu
    JOIN public.clientes c ON cu.cliente_id = c.id
    WHERE cu.user_id = user_uuid 
    AND c.slug = client_slug 
    AND cu.activo = true 
    AND c.activo = true;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Role hierarchy: owner=4, admin=3, empleado=2, viewer=1
    role_hierarchy := CASE user_role
        WHEN 'owner' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'empleado' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    required_hierarchy := CASE required_role
        WHEN 'owner' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'empleado' THEN 2
        WHEN 'viewer' THEN 1
        ELSE 0
    END;
    
    RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default IVA rate for Mexico
INSERT INTO public.iva_rates (pais, rate, activo, fecha_inicio) 
VALUES ('MX', 0.1600, true, '2024-01-01')
ON CONFLICT DO NOTHING;

-- Insert default system configuration
INSERT INTO public.system_config (clave, valor, descripcion) VALUES
('max_clients', '50', 'Maximum number of clients allowed'),
('default_plan_limits', '{"basic": {"max_usuarios": 5, "max_tickets_mes": 500}}', 'Default plan limitations'),
('ocr_config', '{"primary_provider": "anthropic", "max_retries": 3, "timeout_ms": 30000}', 'OCR processing configuration'),
('maintenance_mode', 'false', 'System maintenance mode flag')
ON CONFLICT (clave) DO NOTHING;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = public.tz_now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clientes_usuarios_updated_at 
    BEFORE UPDATE ON public.clientes_usuarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ocr_usage_updated_at 
    BEFORE UPDATE ON public.ocr_usage
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update last_activity when client data is accessed
CREATE OR REPLACE FUNCTION public.update_client_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clientes 
    SET last_activity = public.tz_now()
    WHERE id = NEW.cliente_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.clientes IS 'Master table containing all client businesses';
COMMENT ON COLUMN public.clientes.schema_name IS 'Unique schema name for this client data isolation';
COMMENT ON COLUMN public.clientes.slug IS 'URL-friendly identifier used in subdomains';

COMMENT ON TABLE public.clientes_usuarios IS 'Access control mapping users to clients with roles';
COMMENT ON COLUMN public.clientes_usuarios.rol IS 'User role: owner, admin, empleado, viewer';

COMMENT ON TABLE public.ocr_usage IS 'Tracks OCR API usage and costs per client per month';

COMMENT ON FUNCTION public.get_user_schemas(uuid) IS 'Returns all schemas accessible to a user';
COMMENT ON FUNCTION public.user_has_client_access(uuid, text, text) IS 'Checks if user has required access level to client';

-- =============================================================================
-- VALIDATION
-- =============================================================================

-- Verify the master schema was created successfully
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clientes') THEN
        RAISE EXCEPTION 'Master schema creation failed: clientes table not found';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clientes_usuarios') THEN
        RAISE EXCEPTION 'Master schema creation failed: clientes_usuarios table not found';
    END IF;
    
    RAISE NOTICE 'Master schema created successfully';
END $$;