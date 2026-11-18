# Principios SOLID en el Modulo de Incidencias (Tickets)

Este documento detalla como se aplican individualmente los cinco principios SOLID en el modulo de incidencias tecnicas (Tickets), que ahora incluye Commands y Query Handlers para el ciclo de vida completo del ticket.

---

## 1. S - Single Responsibility Principle (Responsabilidad Unica)

Cada componente del modulo tiene una sola razon para cambiar:

| Archivo | Unica Responsabilidad |
| :--- | :--- |
| `TicketCommandController.js` | Desempaqueta HTTP y construye el Command correcto |
| `TicketQueryController.js` | Desempaqueta HTTP y llama al Query Handler correcto |
| `CreateTicketCommand.js` | DTO inmutable: `title`, `description`, `priority`, `departmentId`, `userId` |
| `CreateTicketHandler.js` | Orquesta la creacion: instancia `Ticket` y persiste via `TicketRepository` |
| `DeleteTicketHandler.js` | Orquesta el borrado logico (soft delete) |
| `ChangeTicketStatusHandler.js` | Valida la transicion de estado y actualiza; delega notificacion a `NotificationService` |
| `AssignTicketHandler.js` | Valida que el agente pertenezca al departamento, asigna y notifica |
| `AddTicketAttachmentHandler.js` | Sube el archivo al storage y registra en `ticket_attachments` |
| `GetAllTicketsHandler.js` | Consulta todos los tickets con filtros y paginacion (admin) |
| `GetMyTicketsHandler.js` | Consulta tickets creados por el usuario autenticado |
| `GetAssignedTicketsHandler.js` | Consulta tickets asignados al usuario autenticado |
| `GetTicketByIdHandler.js` | Consulta el detalle completo de un ticket por ID |
| `GetTicketsByDepartmentHandler.js` | Consulta tickets de un departamento via query param |
| `TicketRepository.js` | Encapsula operaciones de escritura: `create`, `softDelete`, `updateStatus`, `assignTicket`, `addAttachment` |
| `TicketReadModel.js` | Encapsula consultas relacionales con JOINs hacia `users` para la vista |
| `Ticket.js` | Modelo de dominio: estructura y reglas de la entidad Ticket |
| `TicketStatus.js` | Enumeracion de estados canonicos y matriz de transiciones permitidas |
| `NotificationService.js` | Envio de push FCM y registro de notificaciones en BD |

---

## 2. O - Open/Closed Principle (Abierto / Cerrado)

**El modulo de tickets es el ejemplo mas claro de este principio en el proyecto:**

- Desde la version inicial solo existian `CreateTicketHandler` y `GetTicketsByDepartmentQuery`.
- Se anadieron `DeleteTicketHandler`, `ChangeTicketStatusHandler`, `AssignTicketHandler` y `AddTicketAttachmentHandler` **sin modificar** ninguno de los handlers existentes.
- Se anadieron `GetAllTicketsHandler`, `GetMyTicketsHandler`, `GetAssignedTicketsHandler` y `GetTicketByIdHandler` **sin modificar** `GetTicketsByDepartmentHandler`.
- Para agregar una futura accion (ej. `ReopenTicketHandler`), solo se crea el nuevo Command y Handler.

---

## 3. L - Liskov Substitution Principle (Sustitucion de Liskov)

- Errores del flujo (`ValidationError`, `BusinessError`) derivan de la clase base `Error`.
- El middleware global `errorHandler.js` puede sustituir y procesar cualquier error derivado de forma uniforme, extrayendo su codigo de estado y lista de errores.
- `ChangeTicketStatusHandler` lanza `BusinessError` cuando la transicion es invalida o el rol no tiene permiso; el middleware lo captura sin condicionales.

---

## 4. I - Interface Segregation Principle (Segregacion de Interfaces)

La arquitectura divide las responsabilidades en contratos minimos:

```text
ITicketRepository (escritura):
  - create(ticket)
  - softDelete(ticketId)
  - updateStatus(ticketId, newStatus)
  - assignTicket(ticketId, assigneeId)
  - addAttachment(ticketId, fileData)

ITicketReadModel (lectura):
  - getAll(filters)
  - getByUserId(userId)
  - getAssignedTo(userId)
  - getById(ticketId)
  - getByDepartmentId(departmentId)
```

- `CreateTicketHandler` solo depende de `ITicketRepository.create`.
- `GetMyTicketsHandler` solo depende de `ITicketReadModel.getByUserId`.
- `AssignTicketHandler` depende de `ITicketRepository.assignTicket` **e** `IUserReadModel.getUserById` (minimo necesario para validar departamento).
- Ninguna clase recibe metodos ajenos a su labor.

---

## 5. D - Dependency Inversion Principle (Inversion de Dependencias)

- Todos los Handlers y Query Handlers reciben sus dependencias **inyectadas por constructor**.
- Ningun handler instancia `TicketRepository`, `TicketReadModel`, `UserReadModel` ni `NotificationService` directamente.
- Los controladores son **factory functions** que reciben los handlers ya instanciados:

```javascript
// src/controllers/TicketCommandController.js
module.exports = function ticketCommandControllerFactory({
  createTicketHandler,
  deleteTicketHandler,
  changeTicketStatusHandler,
  assignTicketHandler,
  addTicketAttachmentHandler
}) {
  return {
    createTicket:  async (req, res, next) => { ... },
    deleteTicket:  async (req, res, next) => { ... },
    changeStatus:  async (req, res, next) => { ... },
    assignTicket:  async (req, res, next) => { ... },
    addAttachment: async (req, res, next) => { ... },
  };
};
```

- El ensamblaje completo ocurre exclusivamente en `src/config/container.js` (Composition Root).
- Los contratos formales se documentan en `src/contracts/index.js` mediante JSDoc.

---

## 6. Ejemplo Destacado: AssignTicketHandler (ISP + DIP)

`AssignTicketHandler` es el caso mas representativo de ISP y DIP combinados:

```javascript
// src/commands/tickets/AssignTicketHandler.js
class AssignTicketHandler {
  constructor({ ticketRepository, userReadModel }) {
    this.ticketRepository = ticketRepository; // ITicketRepository - solo assignTicket
    this.userReadModel    = userReadModel;    // IUserReadModel    - solo getUserById
  }

  async handle({ ticketId, assigneeId, requesterRole, requesterId }) {
    // 1. Verifica que el agente pertenece al departamento (IUserReadModel)
    const solver = await this.userReadModel.getUserById(assigneeId);
    // 2. Asigna y cambia estado a "En revision" (ITicketRepository)
    await this.ticketRepository.assignTicket(ticketId, assigneeId);
  }
}
```

- Depende de **dos contratos minimos**, no de implementaciones concretas.
- Facilita pruebas unitarias con mocks individuales de cada dependencia.
