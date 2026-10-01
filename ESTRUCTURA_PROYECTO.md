# Estructura del Proyecto Backend - Centrix

Este documento describe la organizacion de carpetas y archivos del backend, basado en Clean Architecture y el patron CQRS (Command Query Responsibility Segregation).

---

## 1. Arbol General del Proyecto

```text
centrixBack/
│
├── docs/                                  # Documentacion tecnica y guias de integracion
│   ├── auth-flow.md                       # Flujo completo de autenticacion (Flutter + Backend + Supabase)
│   └── api-tickets-estados.md             # Guia del endpoint de cambio de estado para Frontend (HU-05)
│
├── src/
│   ├── app.js                             # Configuracion principal de Express y middlewares globales
│   │
│   ├── config/                            # Variables de entorno y configuraciones de servicios
│   │   ├── database.js                    # Configuracion de conexion a base de datos
│   │   ├── jwt.js                         # Configuracion de firmas y expiracion de tokens JWT
│   │   └── multer.js                      # Configuracion para subida de archivos y evidencias
│   │
│   ├── core/                              # Capa de Dominio (Reglas e identidades independientes)
│   │   ├── contracts/                     # Interfaces TypeScript (IRepositories, IReadModels)
│   │   ├── entities/                      # Entidades del negocio (User, Ticket, Expense, Department, Approval)
│   │   ├── enums/                         # Constantes y catalogos (TicketStatus, UserRole, ExpenseStatus)
│   │   └── exceptions/                    # Excepciones personalizadas (BusinessError, ValidationError)
│   │
│   ├── application/                       # Capa de Aplicacion (Casos de uso organizados en CQRS)
│   │   ├── commands/                      # Mutaciones y escrituras (Crear, Actualizar, Asignar)
│   │   │   ├── admin/                     # Comandos de administracion (ManageUserCommand)
│   │   │   ├── auth/                      # Comandos de sesion (LoginCommand)
│   │   │   ├── expenses/                  # Comandos de gastos
│   │   │   └── tickets/                   # Comandos de tickets (CreateTicket, UpdateTicketStatus, AssignTicket)
│   │   │
│   │   ├── queries/                       # Consultas de lectura directa (Optimizadas para ViewModels)
│   │   │   ├── admin/                     # Consultas de auditoria y reportes globales
│   │   │   ├── auth/                      # Validacion de token
│   │   │   ├── departments/               # Listados de departamentos
│   │   │   ├── expenses/                  # Consultas de gastos por usuario y pendientes
│   │   │   └── tickets/                   # Consultas de tickets (por usuario, pendientes, por departamento)
│   │   │
│   │   └── tickets/                       # Casos de uso de compatibilidad de tickets
│   │
│   ├── infrastructure/                    # Capa de Infraestructura (Conexiones externas y persistencia)
│   │   ├── db/                            # Cliente de Supabase y migraciones SQL
│   │   │   ├── supabaseClient.js          # Inicializacion del cliente oficial de Supabase
│   │   │   └── migrations/                # Scripts SQL (001_initial, 002_cqrs, 003_tickets_schema)
│   │   ├── read_models/                   # Modelos de lectura optimizados (TicketReadModel, ExpenseReadModel)
│   │   ├── repositories/                  # Repositorios de persistencia (TicketRepository, UserRepository)
│   │   └── services/                      # Servicios externos (NotificationService, AuditService, FileStorage)
│   │
│   ├── interfaces/                        # Capa de Entrada / Adaptadores HTTP
│   │   ├── controllers/                   # Controladores Express divididos en Command y Query
│   │   ├── middlewares/                   # Middlewares (auth, roleCheck, errorHandler, upload)
│   │   ├── routes/                        # Enrutadores HTTP (/api/auth, /api/tickets, /api/expenses, /api/admin)
│   │   └── validators/                    # Validaciones con express-validator (ticketValidator, userValidator)
│   │
│   ├── utils/                             # Utilidades transversales (logger, responseBuilder, validatorHelpers)
│   │
│   └── __tests__/                         # Pruebas unitarias automatizadas con Jest
│       ├── app.test.js                    # Prueba de arranque
│       ├── ManageUserRoles.test.js        # Pruebas de asignacion de roles (HU-11 / HU-12)
│       └── UpdateTicketStatus.test.js     # Pruebas de cambio de estado y notificacion (HU-05)
│
├── .env                                   # Variables de entorno secretas (puerto, claves de Supabase)
├── eslint.config.js                       # Configuracion de calidad de codigo con ESLint
├── GITFLOW_GUIDELINES.md                  # Guia de ramificacion Gitflow y convenciones de commits
├── package.json                           # Dependencias y scripts de ejecucion npm
├── server.js                              # Punto de arranque del servidor Node.js
└── tsconfig.json                          # Configuracion de compilador TypeScript
```

---

## 2. Descripcion Detallada por Capas

### A. `src/interfaces/` (Entrada HTTP)
Es la puerta de entrada a la aplicacion.
- **`routes/ticketRoutes.js`**: Define las URLs publicas y privadas de tickets. Contiene la ruta `PATCH /api/tickets/:ticketId/status`.
- **`controllers/TicketCommandController.js`**: Desempaqueta la peticion HTTP (`ticketId`, `status`, `comment`, `userId`) y la transfiere al comando correspondiente.
- **`middlewares/roleCheck.js`**: Filtra el acceso asegurando que solo usuarios con roles autorizados puedan ejecutar cada accion.
- **`validators/ticketValidator.js`**: Valida que los datos obligatorios lleguen con el tipo de dato correcto antes de procesarlos.

### B. `src/application/` (Logica de Negocio)
Es el nucleo donde residen las reglas de negocio, aislado de la base de datos y de la web.
- **`commands/tickets/UpdateTicketStatusCommand.js`**: Ejecuta las reglas de la HU-05 (valida existencia, valida que no este cerrado, normaliza a 'En revision', invoca persistencia, registra en historial y solicita notificacion al usuario creador).

### C. `src/infrastructure/` (Persistencia y Servicios Externos)
Se comunica con la base de datos y herramientas de terceros.
- **`repositories/TicketRepository.js`**: Ejecuta las sentencias SQL/Supabase contra las tablas `tickets` y `ticket_status_history` / `ticket_historial_estados`.
- **`services/NotificationService.js`**: Obtiene el contacto del usuario creador y entrega el mensaje o correo electronico.
- **`db/migrations/003_tickets_schema.sql`**: Esquema relacional estandarizado de la base de datos de tickets.

### D. `src/core/` (Entidades y Enums)
Contiene las definiciones base que no cambian con frecuencia.
- **`enums/TicketStatus.js`**: Catalogo de estados oficiales (`Abierto`, `En revision`, `En progreso`, `Resuelto`, `Cerrado`) y funcion normalizadora.
- **`enums/UserRole.js`**: Catalogo de roles (`colaborador`, `gerente`, `administrador`, `soporte_tecnico`, `soporte`).

---

## 3. Modulo de tu Responsabilidad: HU-05 (PPS-90 y PPS-91)

Los archivos especificos donde reside tu funcionalidad desarrollada son:

1. **Ruta y Seguridad:** `src/interfaces/routes/ticketRoutes.js`
2. **Controlador:** `src/interfaces/controllers/TicketCommandController.js`
3. **Logica de Negocio:** `src/application/commands/tickets/UpdateTicketStatusCommand.js`
4. **Base de Datos:** `src/infrastructure/repositories/TicketRepository.js`
5. **Notificacion al Creador:** `src/infrastructure/services/NotificationService.js`
6. **Validacion de Entrada:** `src/interfaces/validators/ticketValidator.js`
7. **Pruebas Automatizadas:** `src/__tests__/UpdateTicketStatus.test.js`
8. **Documentacion para Frontend:** `docs/api-tickets-estados.md`
