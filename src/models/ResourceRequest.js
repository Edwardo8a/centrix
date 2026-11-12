const BusinessError = require('../exceptions/BusinessError');
const { VALID_CATEGORIES, normalizeResourceRequestCategory } = require('../enums/ResourceRequestCategory');
const { ResourceRequestStatus } = require('../enums/ResourceRequestStatus');

class ResourceRequest {
  constructor({
    title,
    description,
    category,
    department_id,
    created_by,
    estimated_amount = null,
    status = ResourceRequestStatus.PENDIENTE
  }) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new BusinessError('El título de la solicitud es obligatorio', 400);
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new BusinessError('La descripción de la solicitud es obligatoria', 400);
    }

    const normalizedCategory = normalizeResourceRequestCategory(category);
    if (!normalizedCategory || !VALID_CATEGORIES.includes(normalizedCategory)) {
      throw new BusinessError(
        `La categoría debe ser una de las siguientes: ${VALID_CATEGORIES.join(', ')}`,
        400
      );
    }

    if (!department_id) {
      throw new BusinessError('El departamento es obligatorio', 400);
    }
    if (!created_by) {
      throw new BusinessError('El solicitante es obligatorio', 400);
    }

    if (estimated_amount !== null && estimated_amount !== undefined) {
      const amount = Number(estimated_amount);
      if (isNaN(amount) || amount < 0) {
        throw new BusinessError('El monto estimado debe ser un número mayor o igual a cero', 400);
      }
      this.estimated_amount = amount;
    } else {
      this.estimated_amount = null;
    }

    this.title = title.trim();
    this.description = description.trim();
    this.category = normalizedCategory;
    this.department_id = department_id;
    this.created_by = created_by;
    this.status = status;
  }
}

module.exports = ResourceRequest;
