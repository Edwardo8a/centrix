# Indice de Documentacion Tecnica - Centrix Backend

Bienvenido a la documentacion tecnica y arquitectonica del backend de Centrix. La documentacion esta organizada por modulos y temas para facilitar su consulta y mantenimiento bajo la arquitectura **CQRS (Command Query Responsibility Segregation)** y los principios **SOLID**.

---

## 1. Estructura de la Documentacion

```text
docs/
|-- README.md                    # Indice principal y mapa general de documentacion (este archivo)
|-- SOLID.md                     # Resumen y matriz de cumplimiento de principios SOLID
|
|-- conexion-apis/               # Guias tecnicas de consumo de endpoints para Frontend (Flutter/Web)
|   |-- auth.md                  # Inicio de sesion (POST /api/auth/login)
|   |-- tickets-crear.md         # Creacion basica de incidencias HU-03 (POST /api/tickets)
|   |-- tickets-consultas.md     # Todas las consultas de tickets (GET /, /mine, /assigned, /department, /:id)
|   |-- tickets-departamento.md  # Consulta de tickets por departamento (GET /api/tickets/department?department_id=)
|   |-- tickets-estados.md       # Cambio de estado de tickets (PATCH /api/tickets/:id/status)
|   |-- tickets-asignar.md       # Asignacion de agente a ticket (PATCH /api/tickets/:id/assign)
|   |-- tickets-eliminar.md      # Eliminacion logica de tickets (DELETE /api/tickets/:id)
|   |-- tickets-adjuntos.md      # Subida de archivos adjuntos (POST /api/tickets/:id/attachments)
|   |-- users-solvers.md         # Lista de agentes de soporte por departamento (GET /api/users/solvers)
|   |-- notifications.md         # Notificaciones in-app y registro de tokens FCM
|   |-- departamentos.md         # Catalogo de departamentos HU-13 (GET /api/departments)
|   `-- admin-usuarios.md        # Registro de usuarios por administrador HU-11 (POST /api/admin/users)
|
|-- flujos-http/                 # Ruta paso a paso End-to-End (Frontend Flutter + Backend CQRS)
|   |-- flujo-auth.md            # Ciclo de vida completo del login (View -> ViewModel -> Handler -> Service)
|   |-- flujo-admin-usuarios.md  # Ciclo de vida completo de creacion de usuarios (Admin View -> Handler -> Supabase)
|   |-- flujo-tickets-crear.md   # Ciclo de vida completo de creacion de tickets (HU-03)
|   |-- flujo-tickets-consulta.md# Ciclo de vida de consulta de tickets por departamento
|   |-- flujo-tickets-estados.md # Ciclo de vida del cambio de estado con matriz y notificaciones FCM
|   `-- flujo-tickets-asignar.md # Ciclo de vida de asignacion con validacion de agente y notificaciones
|
|-- cqrs/                        # Separacion de Comandos y Consultas
|   |-- cqrs-explicacion.md      # Teoria y fundamentos del patron CQRS
|   |-- cqrs-auth.md             # Aplicacion de CQRS en autenticacion
|   `-- cqrs-tickets.md          # Aplicacion de CQRS en tickets (todos los Commands y Query Handlers)
|
`-- solid/                       # Aplicacion detallada de los 5 principios SOLID
    |-- solid-explicacion.md     # Teoria de principios S, O, L, I, D
    |-- solid-auth.md            # Desglose de SOLID en el modulo de autenticacion
    `-- solid-tickets.md         # Desglose de SOLID en el modulo de incidencias (Tickets)
```

---

## 2. Mapa Rapido de Endpoints Activos

| Modulo | Metodo | Endpoint | Operacion CQRS | Roles Autorizados | Descripcion |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Command | Publico | Inicio de sesion y emision de JWT |
| **Tickets** | `POST` | `/api/tickets` | Command | colaborador, gerente, admin | Creacion basica de tickets (HU-03) |
| **Tickets** | `GET` | `/api/tickets` | Query | administrador | Lista todos los tickets (filtros + paginacion) |
| **Tickets** | `GET` | `/api/tickets/mine` | Query | Todos autenticados | Tickets creados por el usuario |
| **Tickets** | `GET` | `/api/tickets/assigned` | Query | soporte_tecnico, admin | Tickets asignados al usuario |
| **Tickets** | `GET` | `/api/tickets/department?department_id=` | Query | gerente, admin | Tickets asignados a un departamento |
| **Tickets** | `GET` | `/api/tickets/:id` | Query | colaborador, soporte, gerente, admin | Detalle completo de un ticket |
| **Tickets** | `PATCH` | `/api/tickets/:id/status` | Command | gerente, soporte, admin | Cambio de estado segun matriz |
| **Tickets** | `PATCH` | `/api/tickets/:id/assign` | Command | gerente, admin | Asignacion de agente |
| **Tickets** | `POST` | `/api/tickets/:id/attachments` | Command | Todos autenticados | Subida de archivo adjunto |
| **Tickets** | `DELETE` | `/api/tickets/:id` | Command | administrador | Borrado logico (soft delete) |
| **Departamentos** | `GET` | `/api/departments` | Query | Todos autenticados | Catalogo de departamentos (HU-13) |
| **Usuarios** | `GET` | `/api/users/solvers?department_id=` | Query | gerente, admin | Lista de agentes de soporte por departamento |
| **Usuarios** | `POST` | `/api/users/device-token` | Command | Todos autenticados | Registra token FCM para push |
| **Usuarios** | `DELETE` | `/api/users/device-token` | Command | Todos autenticados | Da de baja token FCM |
| **Notificaciones** | `GET` | `/api/notifications?limit=&offset=` | Query | Todos autenticados | Lista de notificaciones in-app |
| **Notificaciones** | `PATCH` | `/api/notifications/:id/read` | Command | Todos autenticados | Marca notificacion como leida |
| **Admin** | `POST` | `/api/admin/users` | Command | administrador | Alta de nuevos usuarios en Auth y BD (HU-11) |
| **Sistema** | `GET` | `/health` | - | Publico | Health check del servidor |

---

## 3. Guias Rapidas por Rol

- **Desarrollador Frontend (Flutter / Web):**  
  Revisa la carpeta `docs/conexion-apis/` para conocer cabeceras, JSONs de peticion, codigos de respuesta y ejemplos listos en Dart, asi como `docs/flujos-http/` para entender el ciclo de vida completo de cada pantalla.
- **Desarrollador Backend & DevOps:**  
  Revisa `docs/flujos-http/` y `docs/SOLID.md` para entender el ensamblaje en `src/config/container.js`, la inyeccion de dependencias, el servicio transversal `NotificationService` y el manejo centralizado de errores.
- **Diseno y Buenas Practicas:**  
  Revisa `docs/cqrs/` y `docs/solid/` para conocer el patron arquitectonico y los contratos formales en `src/contracts/index.js`.
