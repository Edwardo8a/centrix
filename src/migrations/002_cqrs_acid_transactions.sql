-- Transacciones atómicas ACID para CQRS (Comandos)

-- 1. Función atómica para crear ticket con registro en log de auditoría (ACID Transaction)
CREATE OR REPLACE FUNCTION create_ticket_transaction(
  p_title VARCHAR(255),
  p_description TEXT,
  p_category VARCHAR(50),
  p_created_by UUID
) RETURNS JSON AS $$
DECLARE
  v_ticket_id UUID;
  v_result JSON;
BEGIN
  -- Insertar Ticket
  INSERT INTO tickets (title, description, category, status, created_by)
  VALUES (p_title, p_description, p_category, 'abierto', p_created_by)
  RETURNING id INTO v_ticket_id;

  -- Insertar Registro de Auditoría
  INSERT INTO audit_logs (user_id, action, table_affected, record_id)
  VALUES (p_created_by, 'CREATE_TICKET', 'tickets', v_ticket_id);

  -- Retornar ticket creado en JSON
  SELECT row_to_json(t) INTO v_result
  FROM tickets t WHERE t.id = v_ticket_id;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE; -- Garantiza el ROLLBACK completo de la transacción
END;
$$ LANGUAGE plpgsql;

-- 2. Función atómica para actualizar estado de gasto y registrar aprobación (ACID Transaction)
CREATE OR REPLACE FUNCTION update_expense_status_transaction(
  p_expense_id UUID,
  p_status VARCHAR(50),
  p_approver_id UUID,
  p_comment TEXT
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Actualizar estado del gasto
  UPDATE expenses
  SET status = p_status, approved_by = p_approver_id, updated_at = NOW()
  WHERE id = p_expense_id;

  -- Insertar aprobación
  INSERT INTO approvals (request_type, request_id, approver_id, action, comment)
  VALUES ('expense', p_expense_id, p_approver_id, p_status, p_comment);

  -- Insertar log de auditoría
  INSERT INTO audit_logs (user_id, action, table_affected, record_id)
  VALUES (p_approver_id, 'UPDATE_EXPENSE_STATUS_' || UPPER(p_status), 'expenses', p_expense_id);

  SELECT row_to_json(e) INTO v_result
  FROM expenses e WHERE e.id = p_expense_id;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql;
