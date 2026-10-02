# Principios SOLID en el Modulo de Incidencias (Tickets - HU-05)

Este documento detalla como se aplican individualmente los cinco principios SOLID en el flujo de cambio de estado de tickets (`PATCH /api/tickets/:id/status`) correspondiente a la historia de usuario HU-05 (PPS-90 y PPS-91).

---

## 1. S — Single Responsibility Principle (Responsabilidad Unica)

La responsabilidad de cambiar el estado a 'En revision' y notificar al creador esta dividida en capas independientes:

- **`ticketValidator.js`:** Su unica tarea es comprobar que el cuerpo JSON contenga el campo `status` y que sea texto valido.
- **`roleCheck.js`:** Su unica tarea es verificar que el usuario autenticado posea uno de los roles autorizados (`administrador`, `gerente`, `soporte_tecnico`).
- **`TicketCommandController.js`:** Su unica tarea es extraer `ticketId`, `status` y `comment` de la peticion HTTP y delegarlos al comando.
- **`UpdateTicketStatusCommand.js`:** Su unica tarea es validar las reglas de negocio (si el ticket existe, si el estado es admisible, si no esta cerrado) y coordinar las acciones.
- **`TicketRepository.js`:** Su unica tarea es ejecutar los queries de persistencia contra las tablas `tickets` e insertar en `ticket_status_history`.
- **`NotificationService.js`:** Su unica tarea es localizar el medio de contacto del creador y entregar el mensaje de aviso.

---

## 2. O — Open/Closed Principle (Abierto / Cerrado)

- **Estados Extensibles:** Los estados del ticket estan definidos en `TicketStatus.js`. Si manana el negocio decide agregar un estado nuevo (ej. `En espera de repuesto`), se declara en el catalogo y la funcion `normalizeTicketStatus` lo aceptara de inmediato sin tener que reescribir ni una sola linea del comando `UpdateTicketStatusCommand`.
- **Canales de Notificacion Extensibles:** Si en el futuro se desea enviar notificaciones Push a Flutter mediante Firebase Cloud Messaging (FCM) o mensajes por WhatsApp, solo se extiende el metodo `notifyUser` en `NotificationService`. El comando de tickets continuara llamando a `this.notificationService.notifyUser(...)` sin enterarse de que el canal de envio cambio.

---

## 3. L — Liskov Substitution Principle (Sustitucion de Liskov)

- Si el ticket solicitado no existe en la base de datos o si el ticket ya se encuentra cerrado, el comando interrumpe el flujo lanzando:
  ```javascript
  throw new BusinessError('El ticket especificado no existe', 404);
  throw new BusinessError('No se puede cambiar el estado de un ticket cerrado', 400);
  ```
- Al heredar de `Error`, `BusinessError` sustituye a cualquier error nativo de Node.js. El manejador global `errorHandler.js` extrae el `statusCode` asignado y responde al cliente de forma limpia y consistente.

---

## 4. I — Interface Segregation Principle (Segregacion de Interfaces)

- El controlador de comandos `TicketCommandController` y el comando `UpdateTicketStatusCommand` solo interactuan con los metodos de persistencia que necesitan:
  - `ticketRepository.findById(ticketId)`
  - `ticketRepository.updateStatus(ticketId, newStatus)`
  - `ticketRepository.recordStatusHistory(...)`
- No dependen ni cargan metodos pesados de lectura o reportes masivos (`TicketReadModel`). Quien solo necesita cambiar un estado, solo conoce las operaciones de cambio de estado.

---

## 5. D — Dependency Inversion Principle (Inversion de Dependencias)

`UpdateTicketStatusCommand` nunca hace `new TicketRepository()` ni `new NotificationService()` adentro de su metodo de ejecucion. Recibe todas sus dependencias desde el constructor:

```javascript
class UpdateTicketStatusCommand {
  constructor({ ticketRepository, notificationService, auditService }) {
    this.ticketRepository = ticketRepository;         // Dependencia inyectada
    this.notificationService = notificationService;   // Dependencia inyectada
    this.auditService = auditService;                 // Dependencia inyectada
  }

  async execute({ ticketId, newStatus, userId, comment }) {
    // Utiliza las abstracciones sin depender de la implementacion fisica
    const ticket = await this.ticketRepository.findById(ticketId);
    ...
  }
}
```

### Beneficio en Pruebas Unitarias:
Este desacoplamiento permitio crear la suite de pruebas automatizadas `UpdateTicketStatus.test.js` en Jest, donde se inyectaron objetos simulados:

```javascript
const mockTicketRepository = {
  findById: jest.fn(),
  updateStatus: jest.fn(),
  recordStatusHistory: jest.fn()
};
const mockNotificationService = {
  notifyUser: jest.fn().mockResolvedValue({ delivered: true })
};

const command = new UpdateTicketStatusCommand({
  ticketRepository: mockTicketRepository,
  notificationService: mockNotificationService
});
```

Se validaron las 8 reglas de negocio de la HU-05 en menos de 1 segundo sin tocar la base de datos de produccion ni enviar correos reales.
