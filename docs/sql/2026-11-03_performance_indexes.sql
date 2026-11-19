-- =============================================================================
-- Índices recomendados para optimizar la visualización y filtrado de tickets
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tickets_active_created_at
  ON public.tickets (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_active_department
  ON public.tickets (department_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_active_created_by
  ON public.tickets (created_by, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_active_assigned_to
  ON public.tickets (assigned_to, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id
  ON public.ticket_attachments (ticket_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_users_department_id
  ON public.users (department_id);

