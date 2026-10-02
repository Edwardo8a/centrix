# CQRS en el Modulo de Incidencias (Tickets)

El modulo de tickets es el ejemplo mas completo de la aplicacion del patron CQRS en el proyecto, ya que separa tajantemente las acciones de modificacion de las pantallas de consulta.

---

## 1. Separacion Arquitectonica

```text
                               MODULO TICKETS
                                     |
             +-----------------------+-----------------------+
             |                                               |
             v                                               v
   LADO COMMAND (ESCRITURA)                        LADO QUERY (LECTURA)
 src/controllers/TicketCommandController.js     src/controllers/TicketQueryController.js
             |                                               |
             |-- CreateTicketCommand                         |-- GetTicketsByUserQuery
             |-- UpdateTicketStatusCommand                   |-- GetPendingTicketsQuery
             `-- AssignTicketCommand                         |-- GetTicketByIdQuery
             |                                               `-- GetAllTicketsQuery
             v                                               |
  src/repositories/TicketRepository.js                       v
 (Escribe en tickets y                          src/repositories/TicketReadModel.js
  ticket_status_history)                        (Consultas optimizadas para
                                                 pantallas de Flutter)
```

---

## 2. El Lado Command (Comandos de Escritura)

Los comandos se enfocan en la consistencia de datos y la aplicacion estricta de reglas de negocio:

### Casos de Uso Implementados:
- **`CreateTicketCommand.js` (HU-03):** Registra un nuevo ticket, valida departamento y prioridad, e interactua con `TicketRepository`.
- **`UpdateTicketStatusCommand.js` (HU-05):**
  - Valida que el ticket exista y que el estado solicitado sea valido.
  - Impide transiciones imposibles (ej. reabrir tickets cerrados).
  - Modifica la tabla principal `tickets`.
  - Inserta el registro en la tabla de trazabilidad `ticket_status_history`.
  - Dispara la notificacion al creador de la incidencia mediante `NotificationService`.
- **`AssignTicketCommand.js`:** Asigna un responsable a una incidencia y emite aviso.

---

## 3. El Lado Query (Consultas de Lectura)

Las consultas no modifican ningun dato en la base de datos; su objetivo es recuperar informacion lista para ser consumida:

- **`GetAllTicketsQuery.js`:** Obtiene todos los tickets asociados a un departamento especifico.
- **`GetTicketsByUserQuery.js`:** Retorna los tickets reportados por el usuario autenticado.
- **`GetPendingTicketsQuery.js`:** Filtra tickets en estado Abierto y En revision para la cola de atencion.
- **`GetTicketByIdQuery.js`:** Obtiene la ficha detallada de una incidencia.
