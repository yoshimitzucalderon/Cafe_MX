-- =============================================================================
-- CafeMX Multi-Tenant: Client Schema Template
-- Version: 002
-- Description: Template for creating individual client schemas
-- Usage: Replace {SCHEMA} and {SCHEMA_SAFE} placeholders
-- =============================================================================

-- =============================================================================
-- CREATE CLIENT SCHEMA
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS {SCHEMA};

-- =============================================================================
-- CLIENT-SPECIFIC TABLES
-- =============================================================================

-- Tickets OCR for this client
CREATE TABLE {SCHEMA}.tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    image_path TEXT,
    image_size_bytes integer,
    image_mime_type varchar(50),
    fecha_ticket DATE,
    total DECIMAL(10,2),
    subtotal DECIMAL(10,2),
    iva DECIMAL(10,2),
    rfc_emisor VARCHAR(13),
    nombre_emisor TEXT,
    concepto TEXT,
    categoria VARCHAR(50),
    subcategoria VARCHAR(50),
    notas TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    ocr_confidence DECIMAL(3,2),
    api_provider VARCHAR(20) DEFAULT 'anthropic',
    processing_time_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    raw_ocr_response JSONB,
    validation_errors JSONB,
    reviewed_by uuid,
    reviewed_at timestamptz,
    created_by uuid,
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'processed', 'error', 'manual', 'review_needed', 'approved', 'rejected')),
    CONSTRAINT valid_categoria CHECK (categoria IN ('insumos', 'servicios', 'equipos', 'marketing', 'gastos_operativos', 'otros')),
    CONSTRAINT valid_confidence CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
    CONSTRAINT valid_total CHECK (total >= 0),
    CONSTRAINT valid_rfc CHECK (rfc_emisor IS NULL OR public.validate_rfc(rfc_emisor))
);

-- Products management for this client
CREATE TABLE {SCHEMA}.productos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    costo DECIMAL(10,2),
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    unidad_medida VARCHAR(20) DEFAULT 'pza',
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    stock_maximo INTEGER DEFAULT 100,
    ubicacion VARCHAR(100),
    proveedor VARCHAR(255),
    codigo_barras VARCHAR(100),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    es_servicio BOOLEAN DEFAULT false,
    aplica_iva BOOLEAN DEFAULT true,
    created_by uuid,
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT valid_precio CHECK (precio >= 0),
    CONSTRAINT valid_costo CHECK (costo IS NULL OR costo >= 0),
    CONSTRAINT valid_stock CHECK (stock_actual >= 0),
    CONSTRAINT unique_codigo_per_client UNIQUE (codigo)
);

-- Sales/POS for this client
CREATE TABLE {SCHEMA}.ventas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_venta VARCHAR(50),
    subtotal DECIMAL(10,2) NOT NULL,
    iva DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    fecha timestamptz DEFAULT public.tz_now(),
    empleado_id uuid,
    cliente_nombre VARCHAR(255),
    cliente_email VARCHAR(255),
    cliente_telefono VARCHAR(20),
    metodo_pago VARCHAR(50) DEFAULT 'efectivo',
    referencia_pago VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    notas TEXT,
    factura_requerida BOOLEAN DEFAULT false,
    factura_generada BOOLEAN DEFAULT false,
    created_by uuid,
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT valid_metodo_pago CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'credito', 'vales')),
    CONSTRAINT valid_status_venta CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    CONSTRAINT valid_totals CHECK (total = subtotal + iva - descuento),
    CONSTRAINT positive_amounts CHECK (subtotal >= 0 AND iva >= 0 AND descuento >= 0)
);

-- Sale line items
CREATE TABLE {SCHEMA}.venta_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id uuid REFERENCES {SCHEMA}.ventas(id) ON DELETE CASCADE,
    producto_id uuid REFERENCES {SCHEMA}.productos(id),
    producto_nombre VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_unitario DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT positive_cantidad CHECK (cantidad > 0),
    CONSTRAINT positive_precio CHECK (precio_unitario >= 0),
    CONSTRAINT valid_subtotal CHECK (subtotal = (precio_unitario - descuento_unitario) * cantidad)
);

-- Inventory movements
CREATE TABLE {SCHEMA}.movimientos_inventario (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id uuid REFERENCES {SCHEMA}.productos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    costo_unitario DECIMAL(10,2),
    referencia_tipo VARCHAR(20),
    referencia_id uuid,
    notas TEXT,
    created_by uuid,
    created_at timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT valid_tipo CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'merma', 'devolucion')),
    CONSTRAINT valid_stock_calculation CHECK (
        (tipo = 'entrada' AND stock_nuevo = stock_anterior + cantidad) OR
        (tipo = 'salida' AND stock_nuevo = stock_anterior - cantidad) OR
        (tipo = 'ajuste' AND stock_nuevo >= 0)
    )
);

-- Suppliers management
CREATE TABLE {SCHEMA}.proveedores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    rfc VARCHAR(13),
    condiciones_pago VARCHAR(100),
    dias_credito INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    notas TEXT,
    created_by uuid,
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT valid_rfc_proveedor CHECK (rfc IS NULL OR public.validate_rfc(rfc))
);

-- Customer management (basic CRM)
CREATE TABLE {SCHEMA}.clientes_externos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    rfc VARCHAR(13),
    fecha_nacimiento DATE,
    tipo VARCHAR(20) DEFAULT 'regular',
    credito_limite DECIMAL(10,2) DEFAULT 0,
    credito_usado DECIMAL(10,2) DEFAULT 0,
    puntos_lealtad INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    notas TEXT,
    preferencias JSONB DEFAULT '{}',
    created_by uuid,
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT valid_tipo_cliente CHECK (tipo IN ('regular', 'frecuente', 'vip', 'corporativo')),
    CONSTRAINT valid_credito CHECK (credito_usado <= credito_limite),
    CONSTRAINT valid_rfc_cliente CHECK (rfc IS NULL OR public.validate_rfc(rfc))
);

-- Client configuration
CREATE TABLE {SCHEMA}.configuracion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB,
    tipo VARCHAR(20) DEFAULT 'text',
    descripcion TEXT,
    actualizable_usuario BOOLEAN DEFAULT true,
    created_by uuid,
    created_at timestamptz DEFAULT public.tz_now(),
    updated_at timestamptz DEFAULT public.tz_now(),
    
    CONSTRAINT valid_tipo_config CHECK (tipo IN ('text', 'number', 'boolean', 'json', 'color', 'url'))
);

-- Reports and analytics cache
CREATE TABLE {SCHEMA}.reportes_cache (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporte_tipo VARCHAR(50) NOT NULL,
    parametros JSONB NOT NULL,
    resultado JSONB NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    generado_en timestamptz DEFAULT public.tz_now(),
    valido_hasta timestamptz,
    created_by uuid,
    
    CONSTRAINT valid_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Tickets indexes
CREATE INDEX idx_{SCHEMA_SAFE}_tickets_fecha ON {SCHEMA}.tickets(fecha_ticket) WHERE fecha_ticket IS NOT NULL;
CREATE INDEX idx_{SCHEMA_SAFE}_tickets_status ON {SCHEMA}.tickets(status);
CREATE INDEX idx_{SCHEMA_SAFE}_tickets_categoria ON {SCHEMA}.tickets(categoria) WHERE categoria IS NOT NULL;
CREATE INDEX idx_{SCHEMA_SAFE}_tickets_created_at ON {SCHEMA}.tickets(created_at);
CREATE INDEX idx_{SCHEMA_SAFE}_tickets_rfc ON {SCHEMA}.tickets(rfc_emisor) WHERE rfc_emisor IS NOT NULL;

-- Products indexes
CREATE INDEX idx_{SCHEMA_SAFE}_productos_categoria ON {SCHEMA}.productos(categoria) WHERE activo = true;
CREATE INDEX idx_{SCHEMA_SAFE}_productos_codigo ON {SCHEMA}.productos(codigo) WHERE codigo IS NOT NULL;
CREATE INDEX idx_{SCHEMA_SAFE}_productos_stock_minimo ON {SCHEMA}.productos(stock_actual, stock_minimo) WHERE activo = true AND stock_actual <= stock_minimo;
CREATE INDEX idx_{SCHEMA_SAFE}_productos_activo ON {SCHEMA}.productos(activo);

-- Sales indexes
CREATE INDEX idx_{SCHEMA_SAFE}_ventas_fecha ON {SCHEMA}.ventas(fecha);
CREATE INDEX idx_{SCHEMA_SAFE}_ventas_empleado ON {SCHEMA}.ventas(empleado_id);
CREATE INDEX idx_{SCHEMA_SAFE}_ventas_status ON {SCHEMA}.ventas(status);
CREATE INDEX idx_{SCHEMA_SAFE}_ventas_metodo_pago ON {SCHEMA}.ventas(metodo_pago);

-- Inventory movements indexes
CREATE INDEX idx_{SCHEMA_SAFE}_movimientos_producto ON {SCHEMA}.movimientos_inventario(producto_id, created_at);
CREATE INDEX idx_{SCHEMA_SAFE}_movimientos_tipo ON {SCHEMA}.movimientos_inventario(tipo, created_at);

-- Configuration indexes
CREATE INDEX idx_{SCHEMA_SAFE}_configuracion_clave ON {SCHEMA}.configuracion(clave);

-- External clients indexes
CREATE INDEX idx_{SCHEMA_SAFE}_clientes_externos_email ON {SCHEMA}.clientes_externos(email) WHERE email IS NOT NULL;
CREATE INDEX idx_{SCHEMA_SAFE}_clientes_externos_telefono ON {SCHEMA}.clientes_externos(telefono) WHERE telefono IS NOT NULL;
CREATE INDEX idx_{SCHEMA_SAFE}_clientes_externos_activo ON {SCHEMA}.clientes_externos(activo);

-- =============================================================================
-- ROW LEVEL SECURITY (Defense in depth)
-- =============================================================================

ALTER TABLE {SCHEMA}.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA}.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA}.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA}.venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA}.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA}.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA}.clientes_externos ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA}.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE {SCHEMA}.reportes_cache ENABLE ROW LEVEL SECURITY;

-- Generic policy for all tables (schema-level isolation is primary defense)
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.tickets FOR ALL USING (true);
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.productos FOR ALL USING (true);
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.ventas FOR ALL USING (true);
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.venta_items FOR ALL USING (true);
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.movimientos_inventario FOR ALL USING (true);
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.proveedores FOR ALL USING (true);
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.clientes_externos FOR ALL USING (true);
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.configuracion FOR ALL USING (true);
CREATE POLICY "schema_isolation_policy" ON {SCHEMA}.reportes_cache FOR ALL USING (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update timestamps
CREATE TRIGGER update_{SCHEMA_SAFE}_tickets_updated_at 
    BEFORE UPDATE ON {SCHEMA}.tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_{SCHEMA_SAFE}_productos_updated_at 
    BEFORE UPDATE ON {SCHEMA}.productos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_{SCHEMA_SAFE}_ventas_updated_at 
    BEFORE UPDATE ON {SCHEMA}.ventas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_{SCHEMA_SAFE}_proveedores_updated_at 
    BEFORE UPDATE ON {SCHEMA}.proveedores
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_{SCHEMA_SAFE}_clientes_externos_updated_at 
    BEFORE UPDATE ON {SCHEMA}.clientes_externos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_{SCHEMA_SAFE}_configuracion_updated_at 
    BEFORE UPDATE ON {SCHEMA}.configuracion
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inventory management triggers
CREATE OR REPLACE FUNCTION {SCHEMA}.update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Reduce stock when sale item is added
        UPDATE {SCHEMA}.productos 
        SET stock_actual = stock_actual - NEW.cantidad
        WHERE id = NEW.producto_id;
        
        -- Record inventory movement
        INSERT INTO {SCHEMA}.movimientos_inventario (
            producto_id, tipo, cantidad, stock_anterior, stock_nuevo,
            referencia_tipo, referencia_id, created_by
        )
        SELECT 
            NEW.producto_id,
            'salida',
            NEW.cantidad,
            p.stock_actual + NEW.cantidad,
            p.stock_actual,
            'venta',
            NEW.venta_id,
            v.created_by
        FROM {SCHEMA}.productos p
        JOIN {SCHEMA}.ventas v ON v.id = NEW.venta_id
        WHERE p.id = NEW.producto_id;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Restore stock when sale item is deleted (for cancellations)
        UPDATE {SCHEMA}.productos 
        SET stock_actual = stock_actual + OLD.cantidad
        WHERE id = OLD.producto_id;
        
        -- Record inventory movement
        INSERT INTO {SCHEMA}.movimientos_inventario (
            producto_id, tipo, cantidad, stock_anterior, stock_nuevo,
            referencia_tipo, referencia_id
        )
        SELECT 
            OLD.producto_id,
            'entrada',
            OLD.cantidad,
            p.stock_actual - OLD.cantidad,
            p.stock_actual,
            'cancelacion',
            OLD.venta_id
        FROM {SCHEMA}.productos p
        WHERE p.id = OLD.producto_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_{SCHEMA_SAFE}_update_stock_on_sale
    AFTER INSERT OR DELETE ON {SCHEMA}.venta_items
    FOR EACH ROW EXECUTE FUNCTION {SCHEMA}.update_stock_on_sale();

-- =============================================================================
-- DEFAULT CONFIGURATION DATA
-- =============================================================================

-- Insert default configuration for new client
INSERT INTO {SCHEMA}.configuracion (clave, valor, tipo, descripcion, actualizable_usuario) VALUES
('negocio_nombre', '""', 'text', 'Nombre del negocio', true),
('negocio_direccion', '""', 'text', 'Dirección del negocio', true),
('negocio_telefono', '""', 'text', 'Teléfono del negocio', true),
('negocio_email', '""', 'text', 'Email del negocio', true),
('negocio_rfc', '""', 'text', 'RFC del negocio', true),
('moneda', '"MXN"', 'text', 'Moneda del negocio', true),
('zona_horaria', '"America/Mexico_City"', 'text', 'Zona horaria', true),
('iva_rate', '0.16', 'number', 'Tasa de IVA aplicable', true),
('decimales_precios', '2', 'number', 'Decimales en precios', true),
('pos_ticket_template', '""', 'text', 'Plantilla de ticket de venta', true),
('ocr_auto_approve_threshold', '0.9', 'number', 'Umbral de auto-aprobación OCR', true),
('stock_alert_enabled', 'true', 'boolean', 'Alertas de stock mínimo habilitadas', true),
('backup_enabled', 'true', 'boolean', 'Respaldos automáticos habilitados', true),
('theme_color', '"#6366f1"', 'color', 'Color primario de la interfaz', true);

-- Default product categories
INSERT INTO {SCHEMA}.productos (nombre, categoria, precio, es_servicio, activo) VALUES
('Café Americano', 'bebidas_calientes', 25.00, true, true),
('Café Latte', 'bebidas_calientes', 35.00, true, true),
('Capuchino', 'bebidas_calientes', 35.00, true, true),
('Sandwich Jamón y Queso', 'alimentos', 45.00, true, true),
('Muffin Chocolate', 'postres', 30.00, true, true);

-- =============================================================================
-- CLIENT-SPECIFIC VIEWS
-- =============================================================================

-- Sales summary view
CREATE VIEW {SCHEMA}.vista_ventas_resumen AS
SELECT 
    DATE(fecha) as fecha,
    COUNT(*) as num_ventas,
    SUM(subtotal) as subtotal_total,
    SUM(iva) as iva_total,
    SUM(total) as total_dia,
    AVG(total) as ticket_promedio
FROM {SCHEMA}.ventas 
WHERE status = 'completed'
GROUP BY DATE(fecha)
ORDER BY fecha DESC;

-- Low stock products view
CREATE VIEW {SCHEMA}.vista_productos_stock_bajo AS
SELECT 
    id,
    codigo,
    nombre,
    categoria,
    stock_actual,
    stock_minimo,
    (stock_minimo - stock_actual) as deficit
FROM {SCHEMA}.productos 
WHERE activo = true 
AND stock_actual <= stock_minimo
ORDER BY deficit DESC;

-- Monthly OCR tickets view
CREATE VIEW {SCHEMA}.vista_tickets_mes AS
SELECT 
    DATE_TRUNC('month', fecha_ticket) as mes,
    COUNT(*) as total_tickets,
    COUNT(*) FILTER (WHERE status = 'processed') as tickets_procesados,
    COUNT(*) FILTER (WHERE status = 'error') as tickets_error,
    AVG(ocr_confidence) as confidence_promedio,
    SUM(total) FILTER (WHERE total IS NOT NULL) as gastos_total
FROM {SCHEMA}.tickets 
WHERE fecha_ticket IS NOT NULL
GROUP BY DATE_TRUNC('month', fecha_ticket)
ORDER BY mes DESC;

-- =============================================================================
-- FUNCTIONS FOR THIS CLIENT
-- =============================================================================

-- Function to get current stock value
CREATE OR REPLACE FUNCTION {SCHEMA}.get_inventory_value()
RETURNS DECIMAL(12,2) AS $$
DECLARE
    total_value DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(stock_actual * COALESCE(costo, precio)), 0)
    INTO total_value
    FROM {SCHEMA}.productos 
    WHERE activo = true;
    
    RETURN total_value;
END;
$$ LANGUAGE plpgsql;

-- Function to get sales statistics for a period
CREATE OR REPLACE FUNCTION {SCHEMA}.get_sales_stats(
    fecha_inicio DATE,
    fecha_fin DATE
)
RETURNS TABLE(
    total_ventas BIGINT,
    ingresos_brutos DECIMAL(12,2),
    ingresos_netos DECIMAL(12,2),
    ticket_promedio DECIMAL(10,2),
    productos_vendidos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(v.id),
        SUM(v.total),
        SUM(v.subtotal),
        AVG(v.total),
        SUM(vi.cantidad)
    FROM {SCHEMA}.ventas v
    LEFT JOIN {SCHEMA}.venta_items vi ON v.id = vi.venta_id
    WHERE v.status = 'completed'
    AND DATE(v.fecha) BETWEEN fecha_inicio AND fecha_fin;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON SCHEMA {SCHEMA} IS 'Schema for client data isolation in multi-tenant architecture';

COMMENT ON TABLE {SCHEMA}.tickets IS 'OCR processed tickets for expense tracking';
COMMENT ON TABLE {SCHEMA}.productos IS 'Product catalog and inventory management';
COMMENT ON TABLE {SCHEMA}.ventas IS 'Point of sale transactions';
COMMENT ON TABLE {SCHEMA}.venta_items IS 'Line items for each sale';
COMMENT ON TABLE {SCHEMA}.movimientos_inventario IS 'Inventory movement history';
COMMENT ON TABLE {SCHEMA}.proveedores IS 'Supplier management';
COMMENT ON TABLE {SCHEMA}.clientes_externos IS 'Customer relationship management';
COMMENT ON TABLE {SCHEMA}.configuracion IS 'Client-specific configuration settings';

COMMENT ON VIEW {SCHEMA}.vista_ventas_resumen IS 'Daily sales summary for reporting';
COMMENT ON VIEW {SCHEMA}.vista_productos_stock_bajo IS 'Products with low stock levels';
COMMENT ON VIEW {SCHEMA}.vista_tickets_mes IS 'Monthly OCR ticket processing statistics';

-- =============================================================================
-- SCHEMA VALIDATION
-- =============================================================================

DO $$
BEGIN
    -- Verify all essential tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '{SCHEMA}' AND table_name = 'tickets') THEN
        RAISE EXCEPTION 'Client schema creation failed: tickets table not found in schema %', '{SCHEMA}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '{SCHEMA}' AND table_name = 'productos') THEN
        RAISE EXCEPTION 'Client schema creation failed: productos table not found in schema %', '{SCHEMA}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '{SCHEMA}' AND table_name = 'ventas') THEN
        RAISE EXCEPTION 'Client schema creation failed: ventas table not found in schema %', '{SCHEMA}';
    END IF;
    
    RAISE NOTICE 'Client schema % created successfully with all tables and constraints', '{SCHEMA}';
END $$;