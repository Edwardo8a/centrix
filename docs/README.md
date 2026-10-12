# Indice de Documentacion Tecnica - Centrix Backend

Bienvenido a la documentacion tecnica y arquitectonica del backend de Centrix. La documentacion esta organizada por modulos y temas para facilitar su consulta y mantenimiento bajo la arquitectura **CQRS (Command Query Responsibility Segregation)** y los principios **SOLID**.

---

## 1. Estructura de la Documentacion

```text
docs/
|-- README.md                    # Indice principal y mapa general de documentacion
|-- SOLID.md                     # Resumen de cumplimiento de principios SOLID
|
|-- conexion-apis/               # Guias tecnicas de consumo de endpoints para Frontend
|   |-- auth.md                  # Inicio de sesion (POST /api/auth/login)
|   |-- tickets-crear.md         # Creacion basica de incidencias HU-03 (POST /api/tickets)
|   |-- tickets-departamento.md  # Consulta de tickets por departamento (GET /api/tickets/department/:id)
|   |-- departamentos.md         # Catalogo de departamentos HU-13 (GET /api/departments)
|   `-- admin-usuarios.md        # Registro de usuarios por administrador HU-11 (POST /api/admin/users)
|
|-- flujos-http/                 # Ruta paso a paso de como viaja la peticion HTTP
|   |-- flujo-auth.md            # Ciclo de vida completo del login (Controller -> Handler -> Service)
|   |-- flujo-tickets-crear.md   # Ciclo de vida completo de creacion de tickets
|   `-- flujo-tickets-consulta.md# Ciclo de vida de consulta de tickets por departamento
|
|-- cqrs/                        # Separacion de Comandos y Consultas
|   |-- cqrs-explicacion.md      # Teoria y fundamentos del patron CQRS
|   |-- cqrs-auth.md             # Aplicacion de CQRS en autenticacion
|   `-- cqrs-tickets.md          # Aplicacion de CQRS en tickets (Commands y Handlers vs Queries y ReadModels)
|
`-- solid/                       # Aplicacion detallada de los 5 principios SOLID
    |-- solid-explicacion.md     # Teoria de principios S, O, L, I, D
    |-- solid-auth.md            # Desglose de SOLID en el modulo de autenticacion
    `-- solid-tickets.md         # Desglose de SOLID en el modulo de incidencias (Tickets)
```

---

## 2. Mapa Rapido de Endpoints Activos

| Modulo | Metodo | Endpoint | Operacion CQRS | Descripcion |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Command | Inicio de sesion y emision de JWT |
| **Tickets** | `POST` | `/api/tickets` | Command | Creacion basica de tickets (HU-03) |
| **Tickets** | `GET` | `/api/tickets/department/:departmentId` | Query | Consulta de tickets asignados a un departamento |
| **Departamentos** | `GET` | `/api/departments` | Query | Listado de departamentos activos (HU-13) |
| **Admin** | `POST` | `/api/admin/users` | Command | Alta de nuevos usuarios en Auth y base de datos (HU-11) |

---

## 3. Guias Rapidas por Rol

- **Desarrollador Frontend (Flutter / Web):**  
  Revisa la carpeta `docs/conexion-apis/` para conocer cabeceras, JSONs de peticion, validaciones y ejemplos listos en Dart.
- **Desarrollador Backend & DevOps:**  
  Revisa `docs/flujos-http/` y `docs/SOLID.md` para entender el ensamblaje en `src/config/container.js`, la inyeccion de dependencias y el manejo de errores.
- **Diseno y Buenas Practicas:**  
  Revisa `docs/cqrs/` y `docs/solid/` para conocer el patron arquitectonico y los contratos (`src/contracts/index.js`).
