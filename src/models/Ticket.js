const ValidationError = require('../exceptions/ValidationError');

class Ticket {
  constructor({
    title,
    description,
    priority,
    department_id,
    created_by,
    status = 'Abierto'
  }) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new ValidationError('El título es obligatorio', 400);
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new ValidationError('La descripción es obligatoria', 400);
    }
    if (!priority || !['Baja', 'Media', 'Alta', 'Critica'].includes(priority)) {
      throw new ValidationError('La prioridad debe ser Baja, Media, Alta o Critica', 400);
    }
    if (!department_id) {
      throw new ValidationError('El departamento es obligatorio', 400);
    }
    if (!created_by) {
      throw new ValidationError('El creador es obligatorio', 400);
    }

    this.title = title.trim();
    this.description = description.trim();
    this.priority = priority;
    this.department_id = department_id;
    this.status = status;
    this.created_by = created_by;
  }
}

module.exports = Ticket;
