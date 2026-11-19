-- ============================================================================
-- Migración: Función Transaccional RPC para Asignación de Tickets con Historial
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

CREATE OR REPLACE FUNCTION public.assign_ticket_transactional(
  p_ticket_id UUID,
  p_assigned_to UUID,
  p_user_id UUID,
  p_comment TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket RECORD;
BEGIN
  -- 1. Bloquear y verificar el ticket activo
  SELECT id, status, assigned_to INTO v_ticket
  FROM public.tickets
  WHERE id = p_ticket_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket no encontrado o eliminado' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Evitar reasignación redundante en condiciones de carrera
  IF v_ticket.assigned_to IS NOT DISTINCT FROM p_assigned_to THEN
    RAISE EXCEPTION 'El ticket ya se encuentra asignado a este usuario' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Actualizar assigned_to y updated_at sin modificar status
  UPDATE public.tickets
  SET
    assigned_to = p_assigned_to,
    updated_at = NOW()
  WHERE id = p_ticket_id;

  -- 4. Registrar trazabilidad en ticket_status_history manteniendo el estado actual
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
    v_ticket.status,
    v_ticket.status,
    p_comment,
    NOW()
  );

  RETURN jsonb_build_object(
    'id', p_ticket_id
  );
END;
$$;

