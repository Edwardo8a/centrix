-- =============================================================================
-- Migración: Tabla resource_requests (Solicitudes de Recursos)
-- Fecha: 2026-11-12
-- Módulo: Resource Requests - Fase 1 (CQRS)
-- =============================================================================
-- Descripción:
--   Crea la tabla `resource_requests` que almacena solicitudes de recursos
--   materiales, económicos o de mobiliario realizadas por colaboradores,
--   gerentes o administradores. El flujo de aprobación es departamental:
--   el gerente del área revisa y aprueba/rechaza la solicitud.
--
-- Estados válidos (status):
--   Pendiente → Aprobada | Rechazada
--   Aprobada  → En proceso | Cancelada
--   En proceso → Completada | Cancelada
--   Rechazada  → (estado final)
--   Completada → (estado final)
--   Cancelada  → (estado final)
--
-- Categorías válidas (category):
--   Material, Economico, Mobiliario, Papeleria, Equipo, Otro
-- =============================================================================


-- -----------------------------------------------------------------------------
-- A) CREACIÓN DE LA TABLA PRINCIPAL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resource_requests (
  -- Identificador único de la solicitud
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos descriptivos de la solicitud
  title             VARCHAR(150)  NOT NULL,
  description       TEXT          NOT NULL,
  category          VARCHAR(50)   NOT NULL,
  estimated_amount  NUMERIC(12,2) NULL,

  -- Estado de la solicitud (workflow)
  status            VARCHAR(50)   NOT NULL DEFAULT 'Pendiente',

  -- Relaciones
  department_id     UUID          NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  created_by        UUID          NOT NULL REFERENCES public.users(id)       ON DELETE RESTRICT,
  reviewed_by       UUID          NULL     REFERENCES public.users(id)       ON DELETE SET NULL,

  -- Motivo de rechazo (solo cuando status = 'Rechazada')
  rejection_reason  TEXT          NULL,

  -- Auditoría de creación y actualización
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Soft delete
  deleted_at        TIMESTAMPTZ   NULL,
  deleted_by        UUID          NULL     REFERENCES public.users(id)       ON DELETE SET NULL,

  -- Constraints de dominio
  CONSTRAINT chk_resource_requests_category CHECK (
    category IN ('Material', 'Economico', 'Mobiliario', 'Papeleria', 'Equipo', 'Otro')
  ),
  CONSTRAINT chk_resource_requests_status CHECK (
    status IN ('Pendiente', 'Aprobada', 'Rechazada', 'En proceso', 'Completada', 'Cancelada')
  ),
  CONSTRAINT chk_resource_requests_estimated_amount CHECK (
    estimated_amount IS NULL OR estimated_amount >= 0
  )
);

COMMENT ON TABLE public.resource_requests IS
  'Solicitudes de recursos (material, económico, mobiliario, etc.) realizadas por los colaboradores de cada área';

COMMENT ON COLUMN public.resource_requests.category IS
  'Categoría del recurso solicitado: Material | Economico | Mobiliario | Papeleria | Equipo | Otro';

COMMENT ON COLUMN public.resource_requests.status IS
  'Estado actual de la solicitud: Pendiente | Aprobada | Rechazada | En proceso | Completada | Cancelada';

COMMENT ON COLUMN public.resource_requests.reviewed_by IS
  'Usuario (gerente) que revisó y aprobó/rechazó la solicitud. NULL mientras esté Pendiente';

COMMENT ON COLUMN public.resource_requests.rejection_reason IS
  'Motivo del rechazo cuando status = Rechazada. NULL en cualquier otro estado';

COMMENT ON COLUMN public.resource_requests.deleted_at IS
  'Fecha de eliminación lógica (soft delete). NULL indica que el registro está activo';

COMMENT ON COLUMN public.resource_requests.deleted_by IS
  'Usuario que realizó el soft delete';


-- -----------------------------------------------------------------------------
-- B) TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Si la función ya existe para tickets u otras tablas, se reutiliza.
-- El trigger es específico por tabla:
CREATE TRIGGER trg_resource_requests_updated_at
  BEFORE UPDATE ON public.resource_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- -----------------------------------------------------------------------------
-- C) ÍNDICES DE RENDIMIENTO
-- -----------------------------------------------------------------------------

-- Consultar las solicitudes de un usuario (mis solicitudes) — filtro más común
CREATE INDEX IF NOT EXISTS idx_resource_requests_created_by
  ON public.resource_requests (created_by, created_at DESC)
  WHERE deleted_at IS NULL;

-- Consultar solicitudes activas por departamento (vista del gerente)
CREATE INDEX IF NOT EXISTS idx_resource_requests_department_active
  ON public.resource_requests (department_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Filtrar por estado (Pendiente, Aprobada, etc.)
CREATE INDEX IF NOT EXISTS idx_resource_requests_status
  ON public.resource_requests (status)
  WHERE deleted_at IS NULL;

-- Búsqueda por quien revisó (para auditoría futura)
CREATE INDEX IF NOT EXISTS idx_resource_requests_reviewed_by
  ON public.resource_requests (reviewed_by)
  WHERE reviewed_by IS NOT NULL AND deleted_at IS NULL;


-- -----------------------------------------------------------------------------
-- D) ROW LEVEL SECURITY (RLS) — Configuración recomendada para Supabase
-- -----------------------------------------------------------------------------
-- La API del backend usa adminClient (service role key) que omite RLS,
-- por lo que las políticas de acceso se implementan en la capa de negocio
-- (handlers + controllers). Aun así, se habilita RLS como buena práctica
-- para prevenir acceso directo desde el frontend no autorizado.
-- -----------------------------------------------------------------------------

ALTER TABLE public.resource_requests ENABLE ROW LEVEL SECURITY;

-- Política de lectura: solo el service role (backend) puede leer
-- (Los clientes anónimos o autenticados vía JWT no tienen acceso directo)
CREATE POLICY "Service role full access to resource_requests"
  ON public.resource_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- E) DATOS DE PRUEBA (Opcionales — comentar en producción)
-- -----------------------------------------------------------------------------
-- Descomenta y ajusta los UUIDs para insertar registros de prueba en desarrollo:
/*
INSERT INTO public.resource_requests (
  title, description, category, estimated_amount,
  status, department_id, created_by
)
VALUES
  (
    'Silla ergonómica para área de ventas',
    'Se requiere una silla con soporte lumbar para el puesto de trabajo del colaborador',
    'Mobiliario',
    2500.00,
    'Pendiente',
    '<UUID_DEPARTAMENTO>',
    '<UUID_COLABORADOR>'
  ),
  (
    'Resmas de papel bond',
    'Se necesitan 20 resmas de papel bond tamaño carta para impresión de reportes mensuales',
    'Papeleria',
    800.00,
    'Pendiente',
    '<UUID_DEPARTAMENTO>',
    '<UUID_COLABORADOR>'
  );
*/
