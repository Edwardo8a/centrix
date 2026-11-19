# CQRS en el Modulo de Incidencias (Tickets)

El modulo de tickets aplica el patron CQRS separando estrictamente la creacion de tickets de la consulta de incidencias por departamento.

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
             v                                               v
    CreateTicketCommand                             GetTicketsByDepartmentQuery
             |                                               |
             v                                               v
    CreateTicketHandler                             TicketReadModel.js
             |                                      (Consulta con JOINs hacia users
             v                                       optimizada para la UI)
    TicketRepository.js
   (Inserta en tabla tickets)
```

---

## 2. El Lado Command (Creacion de Tickets)

- **`CreateTicketCommand.js`:** DTO inmutable con los datos del formulario (`title`, `description`, `priority`, `departmentId`, `userId`).
- **`CreateTicketHandler.js`:** Handler que valida la entidad `Ticket` y delega la persistencia al repositorio.
- **`TicketRepository.js`:** Repositorio enfocado en operaciones de escritura e insercion en la base de datos Supabase.

---

## 3. El Lado Query (Consulta de Tickets)

- **`GetTicketsByDepartmentQuery.js`:** Objeto de consulta que recibe el `departmentId` e invoca al modelo de lectura.
- **`TicketReadModel.js`:** Realiza consultas relacionales que asocian los tickets con sus usuarios creadores y asignados (`created_by:users`, `assigned_to:users`).
- Resuelve ambiguedades de relaciones en PostgreSQL y devuelve la proyeccion exacta que necesita Flutter sin sobrecargar la entidad de dominio.
