# Estructura del Proyecto Backend - Centrix

Este documento describe la organizacion de carpetas y archivos del backend, estructurado de forma directa bajo el patron **CQRS** (Command Query Responsibility Segregation). Se eliminaron las capas redundantes de Clean Architecture para mantener una arquitectura limpia, pragmatica y facil de mantener.

---

## 1. Arbol General del Proyecto

```text
centrixBack/
|-- docs/                          # Documentacion tecnica modular
|   |-- README.md                  # Indice principal y mapa general de documentacion
|   |-- conexion-apis/             # Guias tecnicas de integracion de endpoints para Frontend
|   |   |-- admin-roles.md         # PUT /api/admin/users/:userId/roles (PPS-42)
|   |   |-- auth.md                # POST /api/auth/login
|   |   |-- departamentos.md       # GET /api/departments (HU-13)
|   |   |-- tickets-crear.md       # POST /api/tickets (HU-03)
|   |   `-- tickets-estados.md     # PATCH /api/tickets/:id/status (HU-05)
|   |-- flujos-http/               # Rutas paso a paso de como viaja la peticion
|   |   |-- flujo-auth.md          # Ciclo de vida del Login
|   |   `-- flujo-tickets.md       # Ciclo de vida del cambio de estado de tickets
|   |-- cqrs/                      # Patron CQRS explicado
|   |   |-- cqrs-explicacion.md    # Teoria y fundamentos de CQRS
|   |   |-- cqrs-auth.md           # CQRS en el modulo de autenticacion
|   |   `-- cqrs-tickets.md        # CQRS en el modulo de tickets
|   `-- solid/                     # Principios SOLID explicados
|       |-- solid-explicacion.md   # Teoria de principios SOLID
|       |-- solid-auth.md          # SOLID aplicado a autenticacion
|       `-- solid-tickets.md       # SOLID aplicado a tickets
|
|-- src/
|   |-- commands/                  # CQRS - Operaciones de Escritura (Commands)
|   |   |-- admin/
|   |   |   `-- ManageUserCommand.js        # Crear usuario y asignar roles
|   |   |-- auth/
|   |   |   `-- LoginCommand.js             # Autenticacion con Supabase y firma JWT
|   |   `-- tickets/
|   |       |-- AssignTicketCommand.js      # Asignacion de ticket a responsable
|   |       |-- CreateTicketCommand.js      # Creacion basica de tickets (HU-03)
|   |       `-- UpdateTicketStatusCommand.js# Cambio de estado, historial y notificacion (HU-05)
|   |
|   |-- queries/                   # CQRS - Operaciones de Lectura (Queries)
|   |   |-- departments/
|   |   |   `-- GetAllDepartmentsQuery.js  # Obtencion de departamentos (HU-13)
|   |   `-- tickets/
|   |       |-- GetAllTicketsQuery.js      # Tickets filtrados por departamento
|   |       |-- GetPendingTicketsQuery.js  # Tickets pendientes para gerencia
|   |       |-- GetTicketByIdQuery.js      # Detalle completo de un ticket
|   |       `-- GetTicketsByUserQuery.js   # Tickets creados por un usuario
|   |
|   |-- controllers/               # Controladores HTTP de Express
|   |   |-- AdminController.js              # Creacion de usuarios y asignacion de roles
|   |   |-- AuthController.js               # Login de usuarios
|   |   |-- DepartmentQueryController.js    # Consultas de departamentos
|   |   |-- TicketCommandController.js      # Acciones de escritura de tickets
|   |   `-- TicketQueryController.js        # Consultas de lectura de tickets
|   |
|   |-- routes/                    # Definicion de rutas HTTP y middlewares asociados
|   |   |-- adminRoutes.js                  # /api/admin
|   |   |-- authRoutes.js                   # /api/auth
|   |   |-- departmentRoutes.js             # /api/departments
|   |   `-- ticketRoutes.js                 # /api/tickets
|   |
|   |-- repositories/              # Acceso a base de datos (Supabase) y ReadModels
|   |   |-- DepartmentRepository.js         # Consultas de la tabla departments
|   |   |-- TicketReadModel.js              # Consultas optimizadas para vistas
|   |   |-- TicketRepository.js             # Persistencia, estados e historial de tickets
|   |   `-- UserRepository.js               # Persistencia de usuarios y roles
|   |
|   |-- models/                    # Modelos y entidades de dominio
|   |   |-- Department.js                   # Modelo de Departamento
|   |   |-- Ticket.js                       # Modelo de Ticket
|   |   `-- User.js                         # Modelo de Usuario
|   |
|   |-- services/                  # Servicios transversales
|   |   `-- NotificationService.js          # Notificaciones al creador por correo y log
|   |
|   |-- middlewares/               # Middlewares de Express
|   |   |-- auth.js                         # Verificacion de token JWT Bearer
|   |   |-- errorHandler.js                 # Manejador centralizado de errores
|   |   `-- roleCheck.js                    # Control de acceso basado en roles
|   |
|   |-- validators/                # Esquemas de validacion con express-validator
|   |   |-- ticketValidator.js              # Validacion de creacion y cambio de estado
|   |   `-- userValidator.js                # Validacion de credenciales de login
|   |
|   |-- enums/                     # Enumeraciones y constantes del negocio
|   |   |-- TicketStatus.js                 # Estados canonicos de tickets y normalizador
|   |   `-- UserRole.js                     # Roles de usuario permitidos
|   |
|   |-- exceptions/                # Clases de error personalizadas
|   |   |-- BusinessError.js                # Error de regla de negocio (400, 404, etc.)
|   |   `-- ValidationError.js              # Error de validacion de payload (422)
|   |
|   |-- config/                    # Configuraciones de la aplicacion
|   |   |-- jwt.js                          # Parametros de firma y expiracion JWT
|   |   `-- supabaseClient.js               # Cliente oficial de Supabase
|   |
|   |-- utils/                     # Utilidades transversales
|   |   |-- logger.js                       # Logger con Winston
|   |   |-- responseBuilder.js              # Estandarizacion de respuestas JSON
|   |   `-- validatorHelpers.js             # Middleware para evaluar validaciones
|   |
|   |-- migrations/                # Scripts SQL de base de datos
|   |   |-- 001_initial_schema.sql
|   |   |-- 002_cqrs_acid_transactions.sql
|   |   `-- 003_tickets_schema.sql
|   |
|   |-- __tests__/                 # Pruebas unitarias automatizadas con Jest
|   |   |-- app.test.js                     # Sanity check
|   |   |-- ManageUserRoles.test.js         # Pruebas de asignacion de roles (HU-11 / HU-12)
|   |   `-- UpdateTicketStatus.test.js      # Pruebas de transicion de estados (HU-05)
|   |
|   `-- app.js                     # Configuracion de Express, CORS, Helmet y rutas
|
|-- server.js                      # Punto de entrada principal y health check
|-- package.json                   # Dependencias y scripts de ejecucion
`-- README.md                      # Documentacion general del repositorio
```

---

## 2. Descripcion del Patron CQRS en Centrix

En esta arquitectura se separan estrictamente las operaciones en dos ramas:

### Rama de Escritura (Commands)
- **Ruta**: `src/commands/`
- **Responsabilidad**: Ejecutan cambios de estado, aplican reglas de negocio e interactuan con repositorios para persistir datos.
- **Ejemplos**:
  - `CreateTicketCommand`: Inserta nuevos tickets en base de datos.
  - `UpdateTicketStatusCommand`: Valida transiciones de estado, actualiza el ticket, registra en el historial y dispara notificaciones.
  - `LoginCommand`: Valida credenciales contra Supabase Auth y emite el JWT.
  - `ManageUserCommand`: Crea usuarios y administra asignacion de roles.

### Rama de Lectura (Queries)
- **Ruta**: `src/queries/`
- **Responsabilidad**: Recuperan informacion optimizada para las vistas del cliente (Frontend Flutter) sin mutar datos.
- **Ejemplos**:
  - `GetAllTicketsQuery`: Obtiene tickets asignados a un departamento especifico.
  - `GetTicketByIdQuery`: Consulta el detalle completo de una incidencia.
  - `GetAllDepartmentsQuery`: Consulta el catalogo de departamentos.
