const TicketStatus = require('../enums/TicketStatus');

class Ticket {
  constructor({
    id,
    Titulo,
    Descripcion,
    Prioridad,
    id_departamento,
    estado = TicketStatus.ABIERTO,
    id_creador,
    id_asignado = null,
    notas_resolucion = null,
    fecha_resolucion = null,
    created_at,
    updated_at
  }) {
    this.id = id;
    this.Titulo = Titulo;
    this.Descripcion = Descripcion;
    this.Prioridad = Prioridad;
    this.id_departamento = id_departamento;
    this.estado = estado;
    this.id_creador = id_creador;
    this.id_asignado = id_asignado;
    this.notas_resolucion = notas_resolucion;
    this.fecha_resolucion = fecha_resolucion;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = Ticket;
