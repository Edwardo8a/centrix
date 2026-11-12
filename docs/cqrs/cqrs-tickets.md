# CQRS en el Modulo de Incidencias (Tickets)

El modulo de tickets aplica el patron CQRS separando estrictamente las operaciones de escritura (Commands y Handlers) de las operaciones de lectura (Queries y Handlers de lectura), con inyeccion de dependencias centralizada en el Composition Root.

---

## 1. Separacion Arquitectonica

```text
                               MODULO TICKETS
                                     |
             +-----------------------+-----------------------+
             |                                               |
             v                                               v
   LADO COMMAND (ESCRITURA)                        LADO QUERY (LECTURA)
   TicketCommandController.js                      TicketQueryController.js
             |                                               |
   +---------+---------+                         +----------+----------+
   |         |         |                         |    |     |    |     |
   v         v         v                         v    v     v    v     v
Create   Delete   Change    Assign   AddAtch   GetAll GetMine GetAssigned GetById GetByDept
Ticket   Ticket   Status    Ticket   ment
Handler  Handler  Handler   Handler  Handler
   |         |         |         |     |
   v         v         v         v     v
   TicketRepository.js            TicketReadModel.js
  (Escritura / Mutacion)          (Lectura con JOINs)
```

---

## 2. Lado Command (Escritura / Mutacion)

Cada comando es un **DTO inmutable** que encapsula los datos de entrada. El handler correspondiente orquesta el caso de uso y delega en el repositorio de escritura.

### 2.1 CreateTicket

- **`CreateTicketCommand.js`:** DTO con `title`, `description`, `priority`, `departmentId`, `userId`.
- **`CreateTicketHandler.js`:** Instancia la entidad `Ticket`, valida e inserta via `TicketRepository`.
- **Endpoint:** `POST /api/tickets`
- **Roles:** `colaborador`, `gerente`, `administrador`

### 2.2 DeleteTicket (Borrado Logico)

- **`DeleteTicketCommand.js`:** DTO con `ticketId`.
- **`DeleteTicketHandler.js`:** Verifica existencia del ticket y ejecuta soft delete (marca `deleted_at`).
- **Endpoint:** `DELETE /api/tickets/:id`
- **Roles:** `administrador`

### 2.3 ChangeTicketStatus

- **`ChangeTicketStatusCommand.js`:** DTO con `ticketId`, `newStatus`, `userId`, `userRole`.
- **`ChangeTicketStatusHandler.js`:** Valida la transicion de estado segun la matriz de `TicketStatus.js`, aplica restricciones por rol y actualiza via `TicketRepository`. Dispara notificacion FCM al creador y al asignado.
- **Endpoint:** `PATCH /api/tickets/:id/status`
- **Roles:** `gerente`, `soporte_tecnico`, `administrador`
- **Matriz de transiciones:**

```text
Abierto      --> En revision | En progreso | Cerrado | Rechazado
En revision  --> En progreso | Resuelto    | Cerrado | Rechazado
En progreso  --> En revision | Resuelto    | Cerrado
Resuelto     --> En progreso | Cerrado
Cerrado      --> (terminal)
Rechazado    --> (terminal)
```

- **Restricciones por rol:**
  - `soporte_tecnico`: solo puede establecer `En revision`, `En progreso`, `Resuelto`.
  - `gerente`: puede usar toda la matriz pero unicamente en tickets de su departamento (anti-IDOR).
  - `administrador`: acceso global completo.

### 2.4 AssignTicket

- **`AssignTicketCommand.js`:** DTO con `ticketId`, `assigneeId`, `requesterId`, `requesterRole`.
- **`AssignTicketHandler.js`:** Valida que el `assigneeId` pertenezca al departamento del ticket (via `userReadModel`), asigna el ticket y cambia el estado automaticamente a `En revision`. Dispara notificacion FCM al nuevo asignado.
- **Endpoint:** `PATCH /api/tickets/:id/assign`
- **Roles:** `gerente`, `administrador`

### 2.5 AddTicketAttachment

- **`AddTicketAttachmentCommand.js`:** DTO con `ticketId`, `fileData`, `userId`.
- **`AddTicketAttachmentHandler.js`:** Sube el archivo al storage de Supabase y registra la URL en la tabla `ticket_attachments`.
- **Endpoint:** `POST /api/tickets/:id/attachments`
- **Roles:** Todos los roles autenticados

---

## 3. Lado Query (Lectura Directa)

Los handlers de lectura no modifican estado. Acceden directamente al `TicketReadModel` que ejecuta consultas relacionales optimizadas con JOINs.

### 3.1 GetAllTickets

- **`GetAllTicketsQuery.js` + `GetAllTicketsHandler.js`:** Lista todos los tickets con soporte de filtros y paginacion.
- **Endpoint:** `GET /api/tickets?status=&priority=&department_id=&page=&limit=`
- **Roles:** `administrador`

### 3.2 GetMyTickets

- **`GetMyTicketsQuery.js` + `GetMyTicketsHandler.js`:** Retorna los tickets creados por el usuario autenticado.
- **Endpoint:** `GET /api/tickets/mine`
- **Roles:** Todos los roles autenticados

### 3.3 GetAssignedTickets

- **`GetAssignedTicketsQuery.js` + `GetAssignedTicketsHandler.js`:** Retorna los tickets asignados al usuario autenticado (alias: `/pending`).
- **Endpoint:** `GET /api/tickets/assigned` | `GET /api/tickets/pending`
- **Roles:** `soporte_tecnico`, `administrador`

### 3.4 GetTicketById

- **`GetTicketByIdQuery.js` + `GetTicketByIdHandler.js`:** Retorna el detalle completo de un ticket por ID.
- **Endpoint:** `GET /api/tickets/:id`
- **Roles:** `colaborador`, `soporte_tecnico`, `gerente`, `administrador`

### 3.5 GetTicketsByDepartment

- **`GetTicketsByDepartmentQuery.js` + `GetTicketsByDepartmentHandler.js`:** Retorna los tickets de un departamento via query param.
- **Endpoint:** `GET /api/tickets/department?department_id=UUID`
- **Roles:** `gerente`, `administrador`

---

## 4. Inyeccion de Dependencias (Composition Root)

Todos los handlers y queries se instancian y conectan en `src/config/container.js`:

```javascript
// Repositories y ReadModels
const ticketRepository = new TicketRepository({ supabase: adminClient });
const ticketReadModel  = new TicketReadModel({ supabase: adminClient, storageClient: adminClient });

// Commands (Escritura)
const createTicketHandler         = new CreateTicketHandler({ ticketRepository });
const deleteTicketHandler         = new DeleteTicketHandler({ ticketRepository });
const changeTicketStatusHandler   = new ChangeTicketStatusHandler({ ticketRepository });
const assignTicketHandler         = new AssignTicketHandler({ ticketRepository, userReadModel });
const addTicketAttachmentHandler  = new AddTicketAttachmentHandler({ ticketRepository });

// Queries (Lectura)
const getAllTicketsHandler         = new GetAllTicketsHandler({ ticketReadModel });
const getMyTicketsHandler         = new GetMyTicketsHandler({ ticketReadModel });
const getAssignedTicketsHandler   = new GetAssignedTicketsHandler({ ticketReadModel });
const getTicketByIdHandler        = new GetTicketByIdHandler({ ticketReadModel });
const getTicketsByDepartmentHandler = new GetTicketsByDepartmentHandler({ ticketReadModel });

// Controladores (Factory Pattern con DI)
const ticketCommandController = ticketCommandControllerFactory({
  createTicketHandler, deleteTicketHandler, changeTicketStatusHandler,
  assignTicketHandler, addTicketAttachmentHandler
});
const ticketQueryController = ticketQueryControllerFactory({
  getAllTicketsHandler, getMyTicketsHandler, getAssignedTicketsHandler,
  getTicketByIdHandler, getTicketsByDepartmentHandler
});
```
