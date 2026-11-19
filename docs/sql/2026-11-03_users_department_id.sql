-- ============================================================================
-- Migración: Asociación de Usuarios a Departamentos (users.department_id)
-- Fecha: 2026-11-03
-- ============================================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- 1. Inicia sesión en el panel de control de Supabase (https://app.supabase.com).
-- 2. Selecciona tu proyecto ("Centrix").
-- 3. En la barra lateral izquierda, haz clic en el icono de "SQL Editor".
-- 4. Haz clic en "New query".
-- 5. Pega todo el contenido de este archivo en el editor de consultas.
-- 6. Haz clic en "Run" (o presiona Ctrl+Enter / Cmd+Enter).
-- ============================================================================

-- 1. Agregar columna department_id (NULLABLE) en public.users con FK a public.departments
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department_id UUID NULL
  CONSTRAINT fk_users_department
  REFERENCES public.departments(id)
  ON DELETE SET NULL;

-- 2. Índice para optimizar búsquedas y validaciones de usuarios por departamento
CREATE INDEX IF NOT EXISTS idx_users_department_id
  ON public.users (department_id);

