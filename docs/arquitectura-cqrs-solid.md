# Arquitectura de Software: CQRS y Principios SOLID por Modulos

Este documento define los fundamentos de diseno de software aplicados en el backend de **Centrix**. Explica en que consiste el patron **CQRS** (Command Query Responsibility Segregation), los principios **SOLID** en general y como se materializa cada concepto en los modulos funcionales del sistema.

---

## 1. Fundamentos Generales de Arquitectura

### 1.1. Que es CQRS (Command Query Responsibility Segregation)
CQRS es un patron arquitectonico que separa formalmente las operaciones del sistema en dos categorias:

1. **Commands (Comandos / Escritura):**
   - Son operaciones que provocan un cambio de estado en el sistema (crear, actualizar, eliminar, iniciar sesion).
   - Su prioridad es la consistencia transaccional, la validacion de reglas de negocio y la integridad de los datos.
   - No deben usarse simplemente para alimentar interfaces graficas complejas.

2. **Queries (Consultas / Lectura):**
   - Son operaciones que solo leen datos sin producir efectos secundarios ni alterar la base de datos.
   - Su prioridad es la velocidad de respuesta y entregar proyecciones DTO optimizadas directamente para los ViewModels de la aplicacion (Flutter / Web).

### 1.2. Los 5 Principios SOLID en General

- **S — Single Responsibility Principle (Responsabilidad Unica):** Una clase o modulo debe tener una unica razon para cambiar, cumpliendo una sola funcion bien delimitada.
- **O — Open/Closed Principle (Abierto / Cerrado):** El software debe estar abierto a extensiones (nuevas caracteristicas) pero cerrado a modificaciones destructivas del codigo existente.
- **L — Liskov Substitution Principle (Sustitucion de Liskov):** Las clases derivadas o implementaciones concretas deben poder reemplazar a sus abstracciones o clases base sin alterar el funcionamiento correcto del programa.
- **I — Interface Segregation Principle (Segregacion de Interfaces):** Los clientes no deben verse obligados a depender de interfaces o metodos que no utilizan.
- **D — Dependency Inversion Principle (Inversion de Dependencias):** Los modulos de alto nivel (reglas de negocio) no deben depender directamente de modulos de bajo nivel (bases de datos, controladores); ambos deben depender de abstracciones inyectadas.

---

## 2. Aplicacion por Modulos

---

### MODULO 1: Autenticacion (Auth)

El modulo de autenticacion gestiona la verificacion de identidad, el acceso inicial y la emision de credenciales JWT para las sesiones de usuario.

#### A. Aplicacion de CQRS en Auth
- **Lado Command (`LoginCommand.js`):** El inicio de sesion se modela como un comando porque produce un efecto en el estado del sistema: valida credenciales de forma criptografica con Supabase Auth, genera un token con tiempo de vida limitado y crea una sesion autenticada.
- **Lado Query (`ValidateTokenQuery.js`):** La validacion pasiva de sesion se modela como una consulta que solo decodifica y verifica la firma del token sin alterar datos.

```text
Flujo CQRS en Auth:
POST /api/auth/login ──► AuthController ──► LoginCommand ──► Supabase Auth + UserRepository ──► JWT Token
```

#### B. Aplicacion de SOLID en Auth
- **S (Responsabilidad Unica):**
  - `userValidator.js`: Valida exclusivamente que el correo tenga formato valido y la contrasena no este vacia.
  - `AuthController.js`: Recibe la peticion HTTP y delega el cuerpo al comando.
  - `LoginCommand.js`: Orquesta la logica de negocio (identidad, datos de persona y firma de JWT).
  - `UserRepository.js`: Unico punto de contacto para unir y consultar las tablas `personas`, `roles_personas` y `roles`.
- **O (Abierto/Cerrado):**
  - Si se integra inicio de sesion con Google (OAuth) o 2FA, se agrega el nuevo proveedor sin alterar la consulta relacional de `UserRepository` ni la estructura de respuesta de `AuthController`.
- **L (Sustitucion de Liskov):**
  - Cuando fallan las credenciales, se lanza `BusinessError('Credenciales invalidas', 401)`. Al heredar de `Error`, el middleware `errorHandler.js` lo captura y responde con codigo 401 de forma estandarizada.
- **I (Segregacion de Interfaces):**
  - `LoginCommand` solo invoca el metodo especifico `findPersonaById(id)` de `UserRepository`. No depende de metodos ajenos como `createUser()` o `assignRoles()`.
- **D (Inversion de Dependencias):**
  - `LoginCommand` recibe el repositorio por inyeccion de dependencias en su constructor (`constructor(userRepository)`). Esto permite sustituir la base de datos real por un `mock` durante pruebas unitarias con Jest.

---

### MODULO 2: Incidencias y Tickets (Tickets - HU-05)

El modulo de tickets gestiona el reporte, asignacion, seguimiento y cambio de estado de incidentes tecnicos.

#### A. Aplicacion de CQRS en Tickets
- **Lado Command (Mutaciones):**
  - `CreateTicketCommand.js`: Registro de nuevas incidencias con garantias ACID.
  - `UpdateTicketStatusCommand.js`: Cambio de estado (ej. de 'Abierto' a 'En revision') y registro de historial de auditoria.
  - `AssignTicketCommand.js`: Asignacion de responsables tecnicos.
  - Todos gestionados a traves de `TicketCommandController.js` y `TicketRepository.js`.
- **Lado Query (Lecturas directas):**
  - `GetTicketsByUserQuery.js`: Consulta de tickets creados por el colaborador.
  - `GetPendingTicketsQuery.js`: Consulta de tickets pendientes para el gerente.
  - Todos gestionados a traves de `TicketQueryController.js` y `TicketReadModel.js`, entregando DTOs planos listos para los ViewModels de Flutter.

```text
Arquitectura CQRS en Tickets:
Comandos (Escritura): TicketCommandController ──► UpdateTicketStatusCommand ──► TicketRepository (DB)
Consultas (Lectura) : TicketQueryController   ──► GetTicketsByUserQuery     ──► TicketReadModel  (DTO)
```

#### B. Aplicacion de SOLID en Tickets
- **S (Responsabilidad Unica):**
  - `ticketValidator.js`: Valida datos obligatorios de la peticion.
  - `roleCheck.js`: Restringe la ejecucion a roles autorizados (administrador, gerente, soporte_tecnico).
  - `UpdateTicketStatusCommand.js`: Aplica validaciones de transicion de estado y coordina la actualizacion.
  - `TicketRepository.js`: Ejecuta sentencias SQL en `tickets` y `ticket_status_history`.
  - `NotificationService.js`: Se encarga exclusivamente de enviar el aviso o correo al creador de la incidencia.
- **O (Abierto/Cerrado):**
  - La definicion de estados en `TicketStatus.js` y la funcion `normalizeTicketStatus` permiten anadir nuevos estados sin tener que reescribir el flujo de control principal.
  - El mecanismo de notificaciones puede extenderse para enviar notificaciones Push o SMS modificando solo `NotificationService`.
- **L (Sustitucion de Liskov):**
  - Si un ticket no existe o ya esta cerrado, se lanzan instancias de `BusinessError` (con codigos 404 y 400 respectivamente). El sistema las trata de manera polimorfica en el manejador global sin interrumpir la estabilidad del servidor.
- **I (Segregacion de Interfaces):**
  - Los controladores de escritura (`TicketCommandController`) no conocen ni cargan las consultas pesadas de lectura (`TicketReadModel`). Cada componente solo consume los metodos que necesita.
- **D (Inversion de Dependencias):**
  - `UpdateTicketStatusCommand` recibe sus colaboradores inyectados:
    ```javascript
    constructor({ ticketRepository, notificationService, auditService }) {
      this.ticketRepository = ticketRepository;
      this.notificationService = notificationService;
      this.auditService = auditService;
    }
    ```
  - Esto permitio escribir la suite de pruebas unitarias `UpdateTicketStatus.test.js` probando el 100% de los casos de exito y error con dobles de prueba (`mocks`), sin conexion a bases de datos ni servicios de correo reales.

---

### MODULO 3: Gastos y Reembolsos (Expenses)

El modulo de gastos gestiona el registro de comprobantes, solicitudes de viaticos y flujos de autorizacion de pagos.

#### A. Aplicacion de CQRS en Gastos
- **Commands:** `CreateExpenseUseCase.js` y `UpdateExpenseStatusUseCase.js` gestionados por `ExpenseCommandController.js` y persistidos con `ExpenseRepository.js`.
- **Queries:** `GetExpensesByUserUseCase.js` y `GetPendingExpensesUseCase.js` gestionados por `ExpenseQueryController.js` y proyectados mediante `ExpenseReadModel.js`.

#### B. Aplicacion de SOLID en Gastos
- **S:** `ExpenseRepository` se encarga de guardar montos y comprobantes; `ApprovalRepository` maneja las firmas y fechas de aprobacion de gerencia.
- **O:** Nuevos estados de gasto (`pendiente`, `aprobado`, `rechazado`, `pagado`) se agregan en `ExpenseStatus.js` sin alterar los algoritmos de calculo.
- **D:** Los casos de uso reciben los repositorios y servicios de almacenamiento de archivos (`FileStorageService`) mediante inyeccion en el constructor.

---

### MODULO 4: Administracion y Auditoria (Admin)

El modulo de administracion permite la gobernanza global del sistema: gestion de usuarios, asignacion de roles y revision de registros de auditoria.

#### A. Aplicacion de CQRS en Admin
- **Commands:** `ManageUserCommand.js` (creacion de cuentas y asignacion de multiples roles a personas).
- **Queries:** `GetGlobalReportsQuery.js` y `GetAuditLogsQuery.js` proyectados por `AdminReportReadModel.js`.

#### B. Aplicacion de SOLID en Admin
- **S:** `ManageUserCommand` valida la creacion y asignacion de roles en la capa de aplicacion, delegando la persistencia intermedia en `UserRepository.assignRoles()`.
- **D:** `AdminController` instancia las consultas y comandos inyectando sus correspondientes modelos de lectura y repositorios.

---

## 3. Matriz Resumen de Beneficios

| Principio / Patron | Problema que evita | Beneficio en Centrix |
| :--- | :--- | :--- |
| **CQRS** | Mezclar consultas pesadas de pantalla con transacciones criticas. | Pantallas de Flutter ultrarrapidas y operaciones de negocio blindadas e independientes. |
| **SRP (Responsabilidad Unica)** | Archivos gigantes de mil lineas ("codigo espagueti"). | Codigo modular donde cada archivo tiene una funcion clara y facil de mantener. |
| **OCP (Abierto / Cerrado)** | Romper codigo viejo cada vez que se agrega una funcionalidad. | Capacidad de incorporar nuevos roles, estados o tipos de notificaciones sin riesgo. |
| **LSP (Sustitucion de Liskov)** | Crashes inesperados por excepciones no controladas. | Manejo uniforme y limpio de errores mediante `BusinessError` y `errorHandler`. |
| **ISP (Segregacion de Interfaces)**| Dependencias innecesarias y codigo acoplado. | Interfaces limpias donde cada comando solo conoce el metodo exacto que requiere. |
| **DIP (Inversion de Dependencias)**| Imposibilidad de probar el codigo sin base de datos real. | Pruebas unitarias ultrarrapidas en Jest usando `mocks` independientes de la red. |
