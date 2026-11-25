-- =============================================================================
-- Migración: Tabla department_budgets (Presupuesto Departamental)
-- Fecha: 2026-11-19
-- Módulo: Resource Requests & Manager Workspace - Fase 2 (Presupuestos)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.department_budgets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID        NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  year            INTEGER     NOT NULL,
  month           INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  allocations     JSONB       NOT NULL DEFAULT '{
    "Equipo": 5000000,
    "Mobiliario": 3000000,
    "Material": 2500000,
    "Papeleria": 1500000,
    "Economico": 2000000,
    "Otro": 1000000
  }'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_department_year_month UNIQUE (department_id, year, month)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_dept_budgets_lookup 
  ON public.department_budgets (department_id, year, month);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.department_budgets ENABLE ROW LEVEL SECURITY;

-- Política de lectura para usuarios autenticados
CREATE POLICY "Permitir lectura de presupuestos a usuarios autenticados"
  ON public.department_budgets
  FOR SELECT
  TO authenticated
  USING (true);

-- Política de escritura/actualización para administradores y gerentes
CREATE POLICY "Permitir gestion de presupuestos a usuarios autenticados"
  ON public.department_budgets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inserción inicial para el departamento Soporte TI (mes actual y año actual)
INSERT INTO public.department_budgets (department_id, year, month, allocations)
SELECT 
  id, 
  EXTRACT(YEAR FROM NOW())::INTEGER, 
  EXTRACT(MONTH FROM NOW())::INTEGER,
  '{
    "Equipo": 5000000,
    "Mobiliario": 3000000,
    "Material": 2500000,
    "Papeleria": 1500000,
    "Economico": 2000000,
    "Otro": 1000000
  }'::jsonb
FROM public.departments
ON CONFLICT (department_id, year, month) DO NOTHING;
