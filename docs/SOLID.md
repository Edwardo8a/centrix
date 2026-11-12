# Cumplimiento de Principios SOLID

Esta es una evaluacion tecnica y documentada de como el proyecto Centrix Backend cumple con los principios SOLID tras la refactorizacion arquitectonica basada en **CQRS** e **Inyeccion de Dependencias**.

---

## 1. Matriz de Cumplimiento SOLID

| Principio | Aplicacion en el Proyecto (Archivos concretos) | Justificacion y Estado |
| :--- | :--- | :--- |
| **S** - Responsabilidad Unica | **Controladores** (`src/controllers/*`): Solo extraen datos HTTP y delegan al Handler/Query. **Commands** (`src/commands/*`): DTOs inmutables. **Handlers** (`src/commands/*Handler.js`): Orquestan un solo caso de uso de escritura. **Query Handlers** (`src/queries/*Handler.js`): Orquestan un solo caso de uso de lectura. **Repositories / ReadModels** (`src/repositories/*`): Encapsulan acceso a BD. **Servicios** (`src/services/AuthService.js`, `TokenService.js`, `NotificationService.js`): Aislaron comunicacion con proveedores externos (Supabase Auth, JWT, Firebase FCM). **Modelos** (`src/models/*`): Encapsulan entidades de dominio. | **Cumplimiento Total.** Cada clase tiene una unica razon para cambiar. |
| **O** - Abierto / Cerrado | Para agregar una nueva accion (ej. ChangeTicketStatus, AssignTicket, AddAttachment), se crean nuevos Commands y Handlers sin modificar los existentes. Nuevas consultas (GetMyTickets, GetAssignedTickets, GetAllTickets, GetTicketById) se agregan como nuevos Query Handlers sin tocar los anteriores. | **Cumplimiento Alto.** El comportamiento se extiende agregando componentes desacoplados. |
| **L** - Sustitucion de Liskov | No existe jerarquia de herencia compleja; se favorece la composicion. `BusinessError` y `ValidationError` heredan de la clase nativa `Error` de JavaScript, permitiendo que el middleware `errorHandler.js` los procese de forma polimorfica sin condicionales rigidos. | **Cumplimiento Total.** Todos los errores se sustituyen limpiamente por `Error`. |
| **I** - Segregacion de Interfaces | La persistencia divide estrictamente lectura y escritura: `UserRepository` (escritura) vs `UserReadModel` (lectura). `TicketRepository` (escritura) vs `TicketReadModel` (lectura). `DepartmentReadModel` (solo lectura). Los contratos formales se documentan en `src/contracts/index.js` mediante JSDoc. | **Cumplimiento Total.** Ningun cliente depende de metodos que no utiliza. |
| **D** - Inversion de Dependencias | Ningun controlador o handler instancia directamente dependencias externas. Todo se inyecta via constructor a traves de `src/config/container.js` (Composition Root), respetando los contratos de `src/contracts/index.js`. Los controladores son factory functions que reciben handlers inyectados. | **Cumplimiento Total.** Los modulos de alto nivel dependen de abstracciones, no de implementaciones concretas. |

---

## 2. Diagrama de la Arquitectura (CQRS + Inyeccion de Dependencias)

```text
                                HTTP Request
                                     |
                                     v
                        [src/controllers/*Controller]
                        (factory functions con DI)
                                     |
                +--------------------+--------------------+
                |                                         |
     (Crea Command DTO)                         (Ejecuta Query)
                |                                         |
                v                                         v
   [src/commands/*Handler.js]            [src/queries/*Handler.js]
        (Escritura / ACID)                    (Lectura Directa)
                |                                         |
     +----------+----------+                              |
     |          |          |                              |
     v          v          v                              v
[src/services] [Repositories] [NotificationService] [ReadModels]
     |          |                    |                    |
     +----------+--------------------+--------------------+
                                     |
                                     v
                         [Supabase PostgreSQL / Auth]
                         [Firebase Admin SDK (FCM)]
```

---

## 3. Composition Root (`src/config/container.js`)

Todas las dependencias se ensamblan en un unico punto de composicion. Los controladores usan el patron **Factory con DI**:

```javascript
// Repositorios y ReadModels
const ticketRepository = new TicketRepository({ supabase: adminClient });
const ticketReadModel  = new TicketReadModel({ supabase: adminClient, storageClient: adminClient });
const userReadModel    = new UserReadModel({ supabase: dataClient });

// Servicios
const authService  = new AuthService({ authClient, adminClient });
const tokenService = new TokenService({ jwtConfig });

// Handlers de escritura (Commands)
const createTicketHandler        = new CreateTicketHandler({ ticketRepository });
const deleteTicketHandler        = new DeleteTicketHandler({ ticketRepository });
const changeTicketStatusHandler  = new ChangeTicketStatusHandler({ ticketRepository });
const assignTicketHandler        = new AssignTicketHandler({ ticketRepository, userReadModel });
const addTicketAttachmentHandler = new AddTicketAttachmentHandler({ ticketRepository });
const loginHandler               = new LoginHandler({ authService, userReadModel, tokenService });
const createUserHandler          = new CreateUserHandler({ authService, userRepository });

// Handlers de lectura (Queries)
const getAllTicketsHandler           = new GetAllTicketsHandler({ ticketReadModel });
const getMyTicketsHandler           = new GetMyTicketsHandler({ ticketReadModel });
const getAssignedTicketsHandler     = new GetAssignedTicketsHandler({ ticketReadModel });
const getTicketByIdHandler          = new GetTicketByIdHandler({ ticketReadModel });
const getTicketsByDepartmentHandler = new GetTicketsByDepartmentHandler({ ticketReadModel });
const getDepartmentSolversHandler   = new GetDepartmentSolversHandler({ userReadModel });

// Controladores (Factory Pattern con DI)
const ticketCommandController = ticketCommandControllerFactory({
  createTicketHandler, deleteTicketHandler, changeTicketStatusHandler,
  assignTicketHandler, addTicketAttachmentHandler
});
const ticketQueryController = ticketQueryControllerFactory({
  getAllTicketsHandler, getMyTicketsHandler, getAssignedTicketsHandler,
  getTicketByIdHandler, getTicketsByDepartmentHandler
});
const userQueryController = userQueryControllerFactory({ getDepartmentSolversHandler });
```

---

## 4. Servicio Transversal: NotificationService

`src/services/NotificationService.js` es un servicio de infraestructura que cruza la capa de escritura:

- Utiliza **Firebase Admin SDK** para enviar push notifications via FCM.
- Registra y consulta device tokens en la tabla `user_device_tokens` de Supabase.
- Registra notificaciones en la tabla `notifications` de Supabase (in-app).
- Si `firebase-credentials.json` no esta presente, opera en **modo degradado**: las notificaciones in-app siguen funcionando pero no se envian push.
- Lo usan: `ChangeTicketStatusHandler` y `AssignTicketHandler`.
