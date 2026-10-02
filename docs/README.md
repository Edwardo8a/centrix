# Indice de Documentacion Tecnica - Centrix Backend

Bienvenido a la documentacion tecnica y arquitectonica del backend de Centrix. La documentacion esta dividida en cuatro carpetas tematicas, organizadas por modulos funcionales bajo la arquitectura CQRS.

---

## Estructura de la Documentacion

```text
docs/
|-- conexion-apis/           # Guias de consumo de endpoints HTTP para el equipo de Frontend
|   |-- auth.md              # Inicio de sesion y obtencion de JWT (POST /api/auth/login)
|   |-- tickets-crear.md     # Creacion de incidencias basicas HU-03 (POST /api/tickets)
|   |-- tickets-estados.md   # Actualizacion de estado a En revision HU-05 (PATCH /api/tickets/:id/status)
|   |-- admin-roles.md       # Asignacion de multiples roles a usuarios PPS-42 (PUT /api/admin/users/:id/roles)
|   `-- departamentos.md     # Catalogo de departamentos (GET /api/departments)
|
|-- flujos-http/             # Ruta paso a paso de como viaja la peticion desde el Frontend hasta la BD
|   |-- flujo-auth.md        # Ciclo de vida completo del inicio de sesion
|   `-- flujo-tickets.md     # Ciclo de vida completo del cambio de estado de tickets (HU-05)
|
|-- cqrs/                    # Separacion de Comandos (Escritura) y Consultas (Lectura) por modulo
|   |-- cqrs-explicacion.md  # Fundamentos del patron CQRS y por que se aplica
|   |-- cqrs-auth.md         # Como se aplica CQRS en Autenticacion (LoginCommand)
|   `-- cqrs-tickets.md      # Como se aplica CQRS en Tickets (Commands vs ReadModels)
|
`-- solid/                   # Aplicacion de los 5 principios SOLID por modulo
    |-- solid-explicacion.md # Definicion teorica de los principios S, O, L, I, D
    |-- solid-auth.md        # Desglose de SOLID en el flujo de inicio de sesion
    `-- solid-tickets.md     # Desglose de SOLID en el modulo de incidencias (HU-05)
```

---

## Guias Rapidas por Rol

- **Desarrollador Frontend (Flutter / Web):**  
  Consulta la carpeta `docs/conexion-apis/` para conocer endpoints, cabeceras, JSONs de peticion y ejemplos listos en Dart.
- **Arquitectura y Backend:**  
  Consulta `docs/flujos-http/` para entender el ruteo, validaciones y capas.
- **Diseno de Software y Buenas Practicas:**  
  Consulta `docs/cqrs/` y `docs/solid/` para comprender las justificaciones tecnicas y patrones implementados.
