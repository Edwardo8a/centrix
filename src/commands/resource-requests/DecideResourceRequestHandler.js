const UserRole = require('../../enums/UserRole');
const { ResourceRequestStatus, normalizeResourceRequestStatus } = require('../../enums/ResourceRequestStatus');
const BusinessError = require('../../exceptions/BusinessError');

class DecideResourceRequestHandler {
  /**
   * @param {{ resourceRequestRepository: import('../../contracts').IResourceRequestRepository, budgetRepository?: any }} deps
   */
  constructor({ resourceRequestRepository, budgetRepository }) {
    this.resourceRequestRepository = resourceRequestRepository;
    this.budgetRepository = budgetRepository;
  }

  async handle(command) {
    const existing = await this.resourceRequestRepository.findById(command.requestId);
    if (!existing) {
      throw new BusinessError('Solicitud de recurso no encontrada', 404);
    }

    // Validar permisos del rol
    if (command.userRole !== UserRole.ADMINISTRADOR) {
      if (command.userRole !== UserRole.GERENTE) {
        throw new BusinessError('Solo gerentes y administradores pueden revisar solicitudes', 403);
      }
      if (!command.userDepartmentId || existing.department_id !== command.userDepartmentId) {
        throw new BusinessError('No tienes permisos para revisar solicitudes de otro departamento', 403);
      }
    }

    // Validar estado actual
    if (existing.status !== ResourceRequestStatus.PENDIENTE) {
      throw new BusinessError('La solicitud ya fue revisada previamente', 409);
    }

    // Normalizar y validar decisión
    const normalizedDecision = normalizeResourceRequestStatus(command.decision);
    if (!normalizedDecision || (normalizedDecision !== ResourceRequestStatus.APROBADA && normalizedDecision !== ResourceRequestStatus.RECHAZADA)) {
      throw new BusinessError('La decisión debe ser "Aprobada" o "Rechazada"', 400);
    }

    if (normalizedDecision === ResourceRequestStatus.RECHAZADA) {
      if (!command.comment || !command.comment.trim()) {
        throw new BusinessError('El motivo del rechazo es obligatorio', 400);
      }
    }

    // Si se aprueba y hay repositorio de presupuesto, validar que no exceda el disponible
    if (normalizedDecision === ResourceRequestStatus.APROBADA && this.budgetRepository && existing.estimated_amount) {
      try {
        const d = existing.created_at ? new Date(existing.created_at) : new Date();
        const budget = await this.budgetRepository.getDepartmentBudget(existing.department_id, d.getFullYear(), d.getMonth() + 1);
        const amountCents = Math.round(Number(existing.estimated_amount) * 100);
        const catInfo = budget.categories.find(c => c.category.toLowerCase() === (existing.category || '').toLowerCase());
        if (catInfo && catInfo.availableCents < amountCents) {
          throw new BusinessError(`El monto (${existing.estimated_amount} MXN) supera el presupuesto disponible en ${existing.category} ($${(catInfo.availableCents / 100).toFixed(2)} MXN)`, 400);
        }
      } catch (err) {
        if (err instanceof BusinessError) throw err;
        // Si hay fallo no crítico en presupuesto, permitir continuar
      }
    }

    const result = await this.resourceRequestRepository.updateDecision(command.requestId, {
      status: normalizedDecision,
      rejectionReason: normalizedDecision === ResourceRequestStatus.RECHAZADA ? command.comment.trim() : (command.comment ? command.comment.trim() : null),
      reviewedBy: command.userId
    });

    return {
      id: command.requestId,
      status: normalizedDecision,
      rejectionReason: result.rejection_reason,
      reviewedBy: result.reviewed_by
    };
  }
}

module.exports = DecideResourceRequestHandler;
