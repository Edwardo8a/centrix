# Flujo de Ejecucion HTTP End-to-End: Consulta de Tickets por Departamento

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP al consultar las incidencias de un departamento, tanto desde la perspectiva del Frontend como en la arquitectura Backend.

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. INTERFAZ DE USUARIO (View)
   - El Gerente o Administrador selecciona un departamento en la pantalla de gestion.
   - La aplicacion cliente prepara la peticion GET inyectando el token JWT:
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer <TOKEN_JWT_GERENTE_O_ADMIN>'
     }
   - Realiza la llamada HTTP:
     client.get(Uri.parse('$baseUrl/api/tickets/department/$departmentId'), headers: ...)
        |
        |  [HTTP GET /api/tickets/department/:departmentId]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. ENRUTADOR
   src/routes/ticketRoutes.js
   - Intercepta la ruta GET /department/:departmentId y ejecuta en serie:
     |-- authMiddleware: Verifica la validez del token JWT
     |-- roleCheck([UserRole.GERENTE, UserRole.ADMINISTRADOR]): Control de acceso por rol
     |-- param('departmentId').isUUID(): Valida que el parametro sea un UUID valido
     `-- validateResult: Si el UUID es invalido responde 400 Bad Request
        |
        v
3. CONTROLADOR
   src/controllers/TicketQueryController.js
   - Extrae departmentId de req.params
   - Invoca: getTicketsByDepartmentQuery.execute(departmentId)
        |
        v
4. QUERY HANDLER (CQRS Read Side)
   src/queries/tickets/GetTicketsByDepartmentQuery.js
   - Delega la consulta directamente en el modelo de lectura:
     await this.ticketReadModel.getTicketsByDepartment(departmentId)
        |
        v
5. MODELO DE LECTURA (ReadModel)
   src/repositories/TicketReadModel.js
   - Ejecuta una consulta relacional optimizada con JOINs hacia la tabla users:
     supabase
       .from('tickets')
       .select(`
         id,
         title,
         description,
         priority,
         status,
         department_id,
         created_at,
         updated_at,
         created_by:users!created_by (id, full_name, email),
         assigned_to:users!assigned_to (id, full_name, email)
       `)
       .eq('department_id', departmentId)
       .order('created_at', { ascending: false });
   - Resuelve de forma explicita la ambiguedad de relaciones en PostgreSQL.
        |
        v
6. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 200 OK con la proyeccion lista para la interfaz:
     {
       "success": true,
       "message": "Tickets del departamento obtenidos exitosamente",
       "data": [
         {
           "id": "325cc46a-...",
           "title": "Falla en equipo de computo",
           "description": "...",
           "priority": "Alta",
           "status": "Abierto",
           "department_id": "0dc6ef63-...",
           "created_at": "2026-10-01T20:00:00.000Z",
           "updated_at": "2026-10-01T20:00:00.000Z",
           "created_by": {
             "id": "9942c9bf-...",
             "full_name": "Eduardo Ochoa Almaraz",
             "email": "usuario@correo.com"
           },
           "assigned_to": null
         }
       ]
     }
        |
        |  [HTTP 200 OK Response]
        v
========================================================================================
                               FRONTEND (PROCESAMIENTO)
========================================================================================
7. RENDERIZADO EN FLUTTER
   - La aplicacion cliente deserializa la lista JSON.
   - Construye la coleccion de tarjetas visuales (ListView / Cards) mostrando:
     * Titulo y prioridad (badge de color)
     * Nombre y correo de quien reporto (`created_by.full_name`)
     * Estado del ticket y fecha de registro
```

---

## 2. Inyeccion de Dependencias en el Flujo Backend

El ensamblaje esta centralizado en `src/config/container.js`:

```javascript
// src/config/container.js
const ticketReadModel = new TicketReadModel({ supabase: dataClient });
const getTicketsByDepartmentQuery = new GetTicketsByDepartmentQuery({ ticketReadModel });

// src/controllers/TicketQueryController.js
const { getTicketsByDepartmentQuery } = require('../config/container');
```
