# CQRS en el Modulo de Incidencias (Tickets)

El modulo de tickets es el ejemplo mas completo de la aplicacion del patron CQRS en el proyecto, ya que separa tajantemente las acciones de modificacion de las pantallas de consulta.

---

## 1. Separacion Arquitectonica

```text
                               MODULO TICKETS
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
       LADO COMMAND (ESCRITURA)                        LADO QUERY (LECTURA)
   TicketCommandController.js                       TicketQueryController.js
             │                                               │
             ├─► CreateTicketCommand                         ├─► GetTicketsByUserQuery
             ├─► UpdateTicketStatusCommand                   ├─► GetPendingTicketsQuery
             └─► AssignTicketCommand                         └─► GetAllTicketsByDepartmentQuery
             │                                               │
             ▼                                               ▼
    TicketRepository.js                              TicketReadModel.js
   (Escribe en tickets y                            (Consultas optimizadas para
  ticket_status_history)                              ViewModels de Flutter)
```

---

## 2. El Lado Command (Comandos de Escritura)

Los comandos se enfocan en la consistencia de datos y la aplicacion estricta de reglas de negocio:

### Casos de Uso Implementados:
- **`CreateTicketCommand.js`:** Registra un nuevo ticket, valida departamento y prioridad, e intenta ejecutar transacciones ACID mediante procedimientos almacenados (RPC) con respaldo a repositorio.
- **`UpdateTicketStatusCommand.js` (HU-05):**
  - Valida que el ticket exista y que el estado solicitado sea valido.
  - Impide transiciones imposibles (ej. reabrir tickets cerrados).
  - Modifica la tabla principal `tickets`.
  - Inserta el registro en la tabla de trazabilidad `ticket_status_history`.
  - Dispara la notificacion al creador de la incidencia mediante `NotificationService`.
- **`AssignTicketCommand.js`:** Asigna un responsable tecnico y registra el cambio en la auditoria general.

---

## 3. El Lado Query (Consultas y Read Models)

Las consultas se enfocan en la velocidad de renderizado de la aplicacion movil en Flutter:

### Casos de Uso Implementados:
- **`GetTicketsByUserQuery.js`:** Retorna la lista de tickets que pertenecen al usuario en sesion.
- **`GetPendingTicketsQuery.js`:** Retorna los tickets con estado `Abierto` o `En revision` para la bandeja de trabajo de gerencia y soporte.
- **`GetAllTicketsByDepartmentQuery.js`:** Retorna incidencias agrupadas por area.

### El Rol de `TicketReadModel.js`:
En lugar de devolver el modelo crudo de la base de datos (con nombres de tablas o formatos confusos), `TicketReadModel` mapea los resultados directamente a los DTOs que esperan los ViewModels de Flutter:

```javascript
// TicketReadModel proyecta directamente el DTO para Flutter TicketListViewModel:
return data.map(ticket => ({
  ticketId: ticket.id,
  title: ticket.title,
  description: ticket.description,
  status: ticket.status,
  createdAtIso: ticket.created_at,
  updatedAtIso: ticket.updated_at,
  authorName: ticket.creator ? ticket.creator.full_name : 'Desconocido',
  assignedToName: ticket.assignee ? ticket.assignee.full_name : 'Sin asignar'
}));
```

Con esto, la aplicacion movil recibe exactamente las propiedades listas para pintar en pantalla sin tener que hacer calculos o concatenaciones en el dispositivo.
