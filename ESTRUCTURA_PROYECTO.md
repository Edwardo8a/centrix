# Estructura del Proyecto Backend - Centrix

Este documento describe la organizacion de carpetas y archivos del backend de Centrix, estructurado de forma estricta bajo el patron **CQRS (Command Query Responsibility Segregation)**, principios **SOLID** y un contenedor de **Inyeccion de Dependencias (Composition Root)**.

---

## 1. Arbol General del Proyecto

```text
centrixBack/
|-- docs/                          # Documentacion tecnica modular
|   |-- README.md                  # Indice principal y mapa general de documentacion
|   |-- SOLID.md                   # Evaluacion y justificacion de principios SOLID
|   |-- conexion-apis/             # Guias tecnicas de integracion de endpoints para Frontend
|   |   |-- admin-usuarios.md      # POST /api/admin/users (HU-11)
|   |   |-- auth.md                # POST /api/auth/login
|   |   |-- departamentos.md       # GET /api/departments (HU-13)
|   |   |-- tickets-crear.md       # POST /api/tickets (HU-03)
|   |   `-- tickets-departamento.md# GET /api/tickets/department/:id
|   |-- flujos-http/               # Rutas paso a paso de como viaja la peticion
|   |   |-- flujo-auth.md          # Ciclo de vida del Login (Controller -> Handler -> Service)
|   |   |-- flujo-tickets-crear.md # Ciclo de vida de Creacion de Tickets
|   |   `-- flujo-tickets-consulta.md # Ciclo de vida de Consulta por Departamento
|   |-- cqrs/                      # Patron CQRS explicado
|   |   |-- cqrs-explicacion.md    # Teoria y fundamentos de CQRS
|   |   |-- cqrs-auth.md           # CQRS en el modulo de autenticacion
|   |   `-- cqrs-tickets.md        # CQRS en el modulo de tickets
|   `-- solid/                     # Principios SOLID explicados por modulo
|       |-- solid-explicacion.md   # Teoria de principios SOLID
|       |-- solid-auth.md          # SOLID aplicado a autenticacion
|       `-- solid-tickets.md       # SOLID aplicado a tickets
|
|-- src/
|   |-- commands/                  # CQRS - Operaciones de Escritura (Commands y Handlers)
|   |   |-- admin/
|   |   |   |-- CreateUserCommand.js        # DTO de creacion de usuario
|   |   |   `-- CreateUserHandler.js        # Orquestador del alta de usuario
|   |   |-- auth/
|   |   |   |-- LoginCommand.js             # DTO de inicio de sesion
|   |   |   `-- LoginHandler.js             # Orquestador de autenticacion y emision de JWT
|   |   `-- tickets/
|   |       |-- CreateTicketCommand.js      # DTO de creacion de ticket
|   |       `-- CreateTicketHandler.js      # Orquestador de creacion y persistencia
|   |
|   |-- queries/                   # CQRS - Operaciones de Lectura (Queries)
|   |   |-- departments/
|   |   |   `-- GetAllDepartmentsQuery.js  # Consulta de departamentos activos
|   |   `-- tickets/
|   |       `-- GetTicketsByDepartmentQuery.js # Consulta de tickets por departamento
|   |
|   |-- controllers/               # Controladores HTTP de Express (delgados)
|   |   |-- AdminController.js              # Controlador de administracion
|   |   |-- AuthController.js               # Controlador de login
|   |   |-- DepartmentQueryController.js    # Controlador de departamentos
|   |   |-- TicketCommandController.js      # Acciones de escritura de tickets
|   |   `-- TicketQueryController.js        # Consultas de tickets
|   |
|   |-- routes/                    # Enrutadores HTTP con middlewares asociados
|   |   |-- adminRoutes.js                  # /api/admin
|   |   |-- authRoutes.js                   # /api/auth
|   |   |-- departmentRoutes.js             # /api/departments
|   |   `-- ticketRoutes.js                 # /api/tickets
|   |
|   |-- repositories/              # Persistencia y Modelos de Lectura (ReadModels)
|   |   |-- DepartmentReadModel.js          # Lectura de la tabla departments
|   |   |-- TicketReadModel.js              # Lectura optimizada con JOINs hacia users
|   |   |-- TicketRepository.js             # Insercion en tabla tickets
|   |   |-- UserReadModel.js                # Lectura de perfiles de usuario y roles
|   |   `-- UserRepository.js               # Insercion en tabla users y user_roles
|   |
|   |-- models/                    # Modelos y entidades de dominio
|   |   |-- Department.js                   # Entidad Departamento
|   |   |-- Ticket.js                       # Entidad Ticket
|   |   `-- User.js                         # Entidad Usuario
|   |
|   |-- services/                  # Servicios de infraestructura
|   |   |-- AuthService.js                  # Comunicacion con Supabase Auth (signUp, signIn, deleteUser)
|   |   `-- TokenService.js                 # Firma y parametrizacion de JWT
|   |
|   |-- contracts/                 # Definicion formal de interfaces y contratos
|   |   `-- index.js                        # Tipos JSDoc (ITicketRepository, IAuthService, etc.)
|   |
|   |-- middlewares/               # Middlewares de Express
|   |   |-- auth.js                         # Verificacion de token JWT Bearer
|   |   |-- errorHandler.js                 # Manejador centralizado de errores
|   |   `-- roleCheck.js                    # Control de acceso basado en roles (RBAC)
|   |
|   |-- validators/                # Esquemas de validacion con express-validator
|   |   |-- ticketValidator.js              # Validacion de tickets
|   |   `-- userValidator.js                # Validacion de login y registro de usuarios
|   |
|   |-- enums/                     # Enumeraciones del negocio
|   |   |-- TicketStatus.js                 # Estados canonicos de tickets
|   |   `-- UserRole.js                     # Roles de usuario permitidos
|   |
|   |-- exceptions/                # Clases de error personalizadas
|   |   |-- BusinessError.js                # Errores de regla de negocio (400, 404, etc.)
|   |   `-- ValidationError.js              # Errores de validacion de payload (422/400)
|   |
|   |-- config/                    # Configuraciones y Contenedor de Dependencias
|   |   |-- container.js                    # Composition Root (Inyeccion de Dependencias)
|   |   |-- jwt.js                          # Configuracion de JWT
|   |   `-- supabaseClient.js               # Clientes dataClient, authClient, adminClient
|   |
|   |-- utils/                     # Utilidades transversales
|   |   |-- logger.js                       # Logger con Winston
|   |   |-- responseBuilder.js              # Estandarizacion de respuestas JSON
|   |   `-- validatorHelpers.js             # Middleware para evaluar validaciones
|   |
|   |-- __tests__/                 # Pruebas unitarias automatizadas con Jest
|   |   |-- app.test.js                     # Sanity check
|   |   |-- CreateTicketHandler.test.js     # Pruebas de creacion de tickets
|   |   |-- CreateUserHandler.test.js       # Pruebas de creacion de usuarios
|   |   |-- GetAllDepartmentsQuery.test.js  # Pruebas de consulta de departamentos
|   |   |-- GetTicketsByDepartmentQuery.test.js # Pruebas de tickets por departamento
|   |   `-- LoginHandler.test.js            # Pruebas de autenticacion y JWT
|   |
|   `-- app.js                     # Configuracion de Express, CORS, Helmet y rutas
|
|-- server.js                      # Punto de entrada principal y health check
|-- package.json                   # Dependencias y scripts de ejecucion
`-- README.md                      # Documentacion general del repositorio
```

---

## 2. Descripcion del Patron CQRS en Centrix

El sistema divide las operaciones en:

### Rama de Escritura (Commands y Handlers)
- **Ruta**: `src/commands/`
- **Componentes**:
  - `Command`: Objeto inmutable de datos (DTO).
  - `Handler`: Orquesta el caso de uso, valida dominio y delega en el repositorio correspondiente.
- **Ejemplos**: `CreateTicketHandler`, `LoginHandler`, `CreateUserHandler`.

### Rama de Lectura (Queries y ReadModels)
- **Ruta**: `src/queries/` y `src/repositories/*ReadModel.js`
- **Componentes**:
  - `Query`: Objeto de consulta con parametros de entrada.
  - `ReadModel`: Consulta optimizada para la vista, resolviendo relaciones y JOINs directamente.
- **Ejemplos**: `GetTicketsByDepartmentQuery` con `TicketReadModel`, `GetAllDepartmentsQuery` con `DepartmentReadModel`.
