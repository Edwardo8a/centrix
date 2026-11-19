# Principios SOLID en el Modulo de Incidencias (Tickets)

Este documento detalla como se aplican individualmente los cinco principios SOLID en el modulo de incidencias tecnicas (Tickets).

---

## 1. S - Single Responsibility Principle (Responsabilidad Unica)

La responsabilidad de crear y consultar tickets se divide en componentes pequenos y especializados:

- **`ticketValidator.js`:** Comprueba que los campos requeridos (`title`, `description`, `priority`, `department_id`) cumplan las reglas de formato.
- **`TicketCommandController.js`:** Desempaqueta la peticion HTTP, construye el `CreateTicketCommand` e invoca `createTicketHandler.handle()`.
- **`TicketQueryController.js`:** Extrae `departmentId` e invoca `getTicketsByDepartmentQuery.execute()`.
- **`CreateTicketCommand.js`:** DTO inmutable con los datos necesarios para registrar el ticket.
- **`CreateTicketHandler.js`:** Orquesta la creacion del ticket instanciando la entidad `Ticket` y delegando en `ticketRepository`.
- **`GetTicketsByDepartmentQuery.js`:** Orquesta la consulta delegando en `ticketReadModel`.
- **`TicketRepository.js`:** Encapsula la insercion del ticket en la tabla `tickets`.
- **`TicketReadModel.js`:** Encapsula la consulta relacional con JOINs hacia `users` para entregar la proyeccion lista a Flutter.
- **`Ticket.js`:** Modelo de dominio que define la estructura y reglas de entidad.

---

## 2. O - Open/Closed Principle (Abierto / Cerrado)

- **Extension sin modificacion:** Si en el futuro se incorpora la asignacion de tickets o el cierre de una incidencia, se crean nuevos comandos y handlers (`CloseTicketCommand`, `CloseTicketHandler`) sin modificar el handler de creacion (`CreateTicketHandler.js`).
- **Nuevas consultas:** Para listar tickets por usuario o por estado, se crean nuevos queries y metodos en `TicketReadModel` sin tocar el repositorio de escritura.

---

## 3. L - Liskov Substitution Principle (Sustitucion de Liskov)

- Errores arrojados en el flujo (`ValidationError`, `BusinessError`) derivan de la clase base `Error`.
- El middleware global `errorHandler.js` puede sustituir y procesar cualquier error derivado de forma uniforme, extrayendo su codigo de estado y lista de errores asociados.

---

## 4. I - Interface Segregation Principle (Segregacion de Interfaces)

- El handler de creacion (`CreateTicketHandler`) solo depende del contrato `ITicketRepository` (operacion `create`).
- El query de lectura (`GetTicketsByDepartmentQuery`) solo depende del contrato `ITicketReadModel` (operacion `getTicketsByDepartment`).
- Ninguna clase recibe metodos ajenos a su labor, evitando dependencias innecesarias entre lectura y escritura.

---

## 5. D - Dependency Inversion Principle (Inversion de Dependencias)

- Tanto los Handlers como los Queries reciben sus dependencias inyectadas por constructor basandose en los contratos de `src/contracts/index.js`.
- Ningun controlador instancia repositorios ni clientes de base de datos; todo se resuelve en el Composition Root (`src/config/container.js`).
