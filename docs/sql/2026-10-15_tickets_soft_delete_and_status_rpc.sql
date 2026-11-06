-- ============================================================================
-- Migración: Borrado Lógico e Historial de Estado para Tickets
-- Fecha: 2026-10-15
-- ============================================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- 1. Inicia sesión en el panel de control de Supabase (https://app.supabase.com).
-- 2. Selecciona tu proyecto ("Centrix").
-- 3. En la barra lateral izquierda, haz clic en el icono de "SQL Editor".
-- 4. Haz clic en "New query".
-- 5. Pega todo el contenido de este archivo en el editor de consultas.
-- 6. Haz clic en "Run" (o presiona Ctrl+Enter / Cmd+Enter).
-- 7. Verifica que la consola indique "Success. No rows returned".
-- ============================================================================

-- 1. Agregar columnas para borrado lógico en la tabla tickets
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID NULL REFERENCES public.users(id);

-- 2. Índice parcial para optimizar consultas de tickets activos por departamento
CREATE INDEX IF NOT EXISTS idx_tickets_department_active
  ON public.tickets (department_id)
  WHERE deleted_at IS NULL;

-- 3. Función Transaccional RPC para Cambio de Estado Consistente (Opción a)
CREATE OR REPLACE FUNCTION public.update_ticket_status_transactional(
  p_ticket_id UUID,
  p_user_id UUID,
  p_new_status VARCHAR,
  p_expected_status VARCHAR,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status VARCHAR;
  v_ticket RECORD;
BEGIN
  -- 1. Bloquear y verificar el ticket activo
  SELECT id, status INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket no encontrado o eliminado' USING ERRCODE = 'P0002';
  END IF;

  v_current_status := v_ticket.status;

  -- 2. Validar que el estado actual coincida con el estado esperado para evitar condiciones de carrera
  IF v_current_status <> p_expected_status THEN
    RAISE EXCEPTION 'El ticket cambio de estado' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Actualizar el ticket (resolved_at se calcula exclusivamente en SQL)
  UPDATE public.tickets
  SET
    status = p_new_status,
    updated_at = NOW(),
    resolved_at = CASE 
      WHEN p_new_status = 'Resuelto' THEN NOW()
      WHEN p_new_status = 'En progreso' AND v_current_status = 'Resuelto' THEN NULL
      ELSE resolved_at
    END
  WHERE id = p_ticket_id;

  -- 4. Registrar en historial de auditoría
  INSERT INTO public.ticket_status_history (
    ticket_id,
    user_id,
    previous_status,
    new_status,
    comment,
    created_at
  ) VALUES (
    p_ticket_id,
    p_user_id,
    v_current_status,
    p_new_status,
    p_comment,
    NOW()
  );

  RETURN jsonb_build_object(
    'id', p_ticket_id,
    'previousStatus', v_current_status,
    'status', p_new_status
  );
END;
$$;
