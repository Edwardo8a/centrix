# Estructura del Proyecto Backend - Centrix

Este documento describe la organizacion de carpetas y archivos del backend de Centrix, estructurado de forma estricta bajo el patron **CQRS (Command Query Responsibility Segregation)**, principios **SOLID**, un contenedor central de **Inyeccion de Dependencias (Composition Root)** y notificaciones con **Firebase Cloud Messaging**.

---

## 1. Arbol General del Proyecto

```text
centrixBack/
|-- docs/                          # Documentacion tecnica modular
|   |-- README.md                  # Indice principal y mapa general de documentacion
|   |-- SOLID.md                   # Evaluacion y justificacion de principios SOLID
|   |-- REPORTE_PRUEBAS_JEST.md    # Reporte automatizado de pruebas Jest
|   |-- conexion-apis/             # Guias tecnicas de integracion de endpoints para Frontend
|   |   |-- admin-usuarios.md      # POST /api/admin/users (HU-11)
|   |   |-- auth.md                # POST /api/auth/login
|   |   |-- departamentos.md       # GET /api/departments (HU-13)
|   |   |-- notifications.md       # Notificaciones in-app y registro de tokens FCM
|   |   |-- tickets-adjuntos.md    # POST /api/tickets/:id/attachments
|   |   |-- tickets-asignar.md     # PATCH /api/tickets/:id/assign
|   |   |-- tickets-consultas.md   # GET /, /mine, /assigned, /department, /:id
|   |   |-- tickets-crear.md       # POST /api/tickets (HU-03)
|   |   |-- tickets-departamento.md# GET /api/tickets/department?department_id=
|   |   |-- tickets-eliminar.md    # DELETE /api/tickets/:id (soft delete)
|   |   |-- tickets-estados.md     # PATCH /api/tickets/:id/status (matriz)
|   |   `-- users-solvers.md       # GET /api/users/solvers?department_id=
|   |-- flujos-http/               # Rutas paso a paso de como viaja la peticion
|   |   |-- flujo-admin-usuarios.md  # Ciclo de vida completo de creacion de usuarios
|   |   |-- flujo-auth.md            # Ciclo de vida del Login
|   |   |-- flujo-tickets-asignar.md # Ciclo de vida de Asignacion de Tickets
|   |   |-- flujo-tickets-consulta.md# Ciclo de vida de Consulta por Departamento
|   |   |-- flujo-tickets-crear.md   # Ciclo de vida de Creacion de Tickets
|   |   `-- flujo-tickets-estados.md # Ciclo de vida del Cambio de Estado con FCM
|   |-- cqrs/                      # Patron CQRS explicado
|   |   |-- cqrs-explicacion.md    # Teoria y fundamentos de CQRS
|   |   |-- cqrs-auth.md           # CQRS en el modulo de autenticacion
|   |   `-- cqrs-tickets.md        # CQRS en tickets (todos los Commands y Queries)
|   `-- solid/                     # Principios SOLID explicados por modulo
|       |-- solid-explicacion.md   # Teoria de principios SOLID
|       |-- solid-auth.md          # SOLID aplicado a autenticacion
|       `-- solid-tickets.md       # SOLID aplicado a tickets (completo)
|
|-- src/
|   |-- commands/                  # CQRS - Operaciones de Escritura (Commands y Handlers)
|   |   |-- admin/
|   |   |   |-- CreateUserCommand.js          # DTO de creacion de usuario
|   |   |   `-- CreateUserHandler.js          # Orquestador del alta de usuario
|   |   |-- auth/
|   |   |   |-- LoginCommand.js               # DTO de inicio de sesion
|   |   |   `-- LoginHandler.js               # Orquestador de autenticacion y JWT
|   |   `-- tickets/
|   |       |-- AddTicketAttachmentCommand.js # DTO para adjuntos
|   |       |-- AddTicketAttachmentHandler.js # Orquestador de upload a Storage
|   |       |-- AssignTicketCommand.js        # DTO de asignacion
|   |       |-- AssignTicketHandler.js        # Orquestador de asignacion y estado
|   |       |-- ChangeTicketStatusCommand.js  # DTO de cambio de estado
|   |       |-- ChangeTicketStatusHandler.js  # Validador de matriz y orquestador
|   |       |-- CreateTicketCommand.js        # DTO de creacion de ticket
|   |       |-- CreateTicketHandler.js        # Orquestador de creacion
|   |       |-- DeleteTicketCommand.js        # DTO de borrado logico
|   |       `-- DeleteTicketHandler.js        # Orquestador de soft delete
|   |
|   |-- queries/                   # CQRS - Operaciones de Lectura (Queries y Handlers)
|   |   |-- departments/
|   |   |   `-- GetAllDepartmentsQuery.js     # Consulta de departamentos activos
|   |   |-- tickets/
|   |   |   |-- GetAllTicketsHandler.js       # Handler de todos los tickets
|   |   |   |-- GetAllTicketsQuery.js         # DTO con filtros y paginacion
|   |   |   |-- GetAssignedTicketsHandler.js  # Handler de tickets asignados
|   |   |   |-- GetAssignedTicketsQuery.js    # DTO con userId de soporte
|   |   |   |-- GetMyTicketsHandler.js        # Handler de tickets creados por mi
|   |   |   |-- GetMyTicketsQuery.js          # DTO con userId creador
|   |   |   |-- GetTicketByIdHandler.js       # Handler de ticket por ID
|   |   |   |-- GetTicketByIdQuery.js         # DTO con ticketId
|   |   |   |-- GetTicketsByDepartmentHandler.js # Handler por departamento
|   |   |   `-- GetTicketsByDepartmentQuery.js   # DTO con departmentId
|   |   `-- users/
|   |       |-- GetDepartmentSolversHandler.js# Handler de agentes por departamento
|   |       `-- GetDepartmentSolversQuery.js  # DTO con departmentId
|   |
|   |-- controllers/               # Controladores HTTP de Express (Factory Pattern)
|   |   |-- AdminController.js                # Controlador de administracion
|   |   |-- AuthController.js                 # Controlador de login
|   |   |-- DepartmentQueryController.js      # Controlador de departamentos
|   |   |-- NotificationController.js         # Controlador de notificaciones
|   |   |-- TicketCommandController.js        # Factory con handlers de escritura inyectados
|   |   |-- TicketQueryController.js          # Factory con handlers de lectura inyectados
|   |   `-- UserQueryController.js            # Factory con queries de usuario
|   |
|   |-- routes/                    # Enrutadores HTTP con middlewares asociados
|   |   |-- adminRoutes.js                    # /api/admin
|   |   |-- authRoutes.js                     # /api/auth
|   |   |-- departmentRoutes.js               # /api/departments
|   |   |-- notificationRoutes.js             # /api/notifications
|   |   |-- ticketRoutes.js                   # /api/tickets
|   |   `-- userRoutes.js                     # /api/users (/device-token, /solvers)
|   |
|   |-- repositories/              # Persistencia y Modelos de Lectura (ReadModels)
|   |   |-- DepartmentReadModel.js            # Lectura de la tabla departments
|   |   |-- TicketReadModel.js                # Lectura optimizada con JOINs hacia users
|   |   |-- TicketRepository.js               # Operaciones de escritura en tickets
|   |   |-- UserReadModel.js                  # Lectura de perfiles de usuario y roles
|   |   `-- UserRepository.js                 # Insercion en users y user_roles
|   |
|   |-- models/                    # Modelos y entidades de dominio
|   |   |-- Department.js                     # Entidad Departamento
|   |   |-- Ticket.js                         # Entidad Ticket
|   |   `-- User.js                           # Entidad Usuario
|   |
|   |-- services/                  # Servicios de infraestructura
|   |   |-- AuthService.js                    # Comunicacion con Supabase Auth
|   |   |-- NotificationService.js            # Firebase Admin SDK (FCM) + Supabase
|   |   `-- TokenService.js                   # Firma y parametrizacion de JWT
|   |
|   |-- contracts/                 # Definicion formal de interfaces y contratos
|   |   `-- index.js                          # Tipos JSDoc (ITicketRepository, etc.)
|   |
|   |-- middlewares/               # Middlewares de Express
|   |   |-- auth.js                           # Verificacion de token JWT Bearer
|   |   |-- errorHandler.js                   # Manejador centralizado de errores
|   |   `-- roleCheck.js                      # Control de acceso basado en roles (RBAC)
|   |
|   |-- validators/                # Esquemas de validacion con express-validator
|   |   |-- ticketValidator.js                # Validacion de tickets y transiciones
|   |   `-- userValidator.js                  # Validacion de login y registro
|   |
|   |-- enums/                     # Enumeraciones del negocio
|   |   |-- TicketStatus.js                   # Estados y matriz de transiciones
|   |   `-- UserRole.js                       # Roles de usuario permitidos
|   |
|   |-- exceptions/                # Clases de error personalizadas
|   |   |-- BusinessError.js                  # Errores de regla de negocio (400, 403, 404)
|   |   `-- ValidationError.js                # Errores de validacion de payload (400)
|   |
|   |-- config/                    # Configuraciones y Contenedor de Dependencias
|   |   |-- container.js                      # Composition Root (Inyeccion de Dependencias)
|   |   |-- jwt.js                            # Configuracion de JWT
|   |   |-- multer.js                         # Configuracion de subida de archivos
|   |   `-- supabaseClient.js                 # Clientes dataClient, authClient, adminClient
|   |
|   |-- utils/                     # Utilidades transversales
|   |   |-- logger.js                         # Logger con Winston
|   |   |-- responseBuilder.js                # Estandarizacion de respuestas JSON
|   |   `-- validatorHelpers.js               # Middleware evaluador de validaciones
|   |
|   `-- app.js                     # Configuracion de Express, CORS, Helmet y rutas
|
|-- tests/                         # Pruebas unitarias automatizadas con Jest (265 tests)
|   |-- commands/                  # Pruebas de handlers de escritura
|   |-- queries/                   # Pruebas de handlers de lectura
|   |-- controllers/               # Pruebas de controladores
|   |-- services/                  # Pruebas de servicios
|   |-- repositories/              # Pruebas de repositorios
|   |-- middlewares/               # Pruebas de middlewares
|   `-- app.test.js                # Sanity check y health check
|
|-- server.js                      # Punto de entrada principal
|-- package.json                   # Dependencias y scripts
`-- README.md                      # Documentacion general del repositorio
```
