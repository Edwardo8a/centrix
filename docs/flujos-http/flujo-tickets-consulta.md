# Flujo de Ejecucion HTTP: Consulta de Tickets por Departamento

Este documento describe la ruta exacta que recorre una peticion HTTP al consultar las incidencias de un departamento.

---

## 1. Diagrama de la Ruta HTTP

```text
1. CLIENTE (Flutter / Web)
   Envia: GET /api/tickets/department/:departmentId
   Header: Authorization: Bearer <TOKEN>
      |
      v
2. ENRUTADOR (src/routes/ticketRoutes.js)
   Aplica los middlewares en serie:
      |-- authMiddleware: Verifica el token JWT Bearer
      |-- roleCheck: Valida roles autorizados [gerente, administrador]
      `-- param('departmentId').isUUID() + validateResult: Valida formato UUID
      |
      v
3. CONTROLADOR (src/controllers/TicketQueryController.js)
   Extrae req.params.departmentId e invoca:
   getTicketsByDepartmentQuery.execute(departmentId)
      |
      v
4. QUERY HANDLER (src/queries/tickets/GetTicketsByDepartmentQuery.js)
   Invoca directamente al modelo de lectura:
   await this.ticketReadModel.getTicketsByDepartment(departmentId)
      |
      v
5. READ MODEL (src/repositories/TicketReadModel.js)
   Ejecuta la consulta relacional optimizada en Supabase:
   supabase.from('tickets')
     .select('id, title, description, priority, status, department_id, created_at, updated_at, created_by:users!created_by(id, full_name, email), assigned_to:users!assigned_to(id, full_name, email)')
     .eq('department_id', departmentId)
      |
      v
6. RESPUESTA HTTP (src/utils/responseBuilder.js)
   Retorna HTTP 200 OK con el listado proyectado para el ViewModel:
   {
     "success": true,
     "message": "Tickets del departamento obtenidos exitosamente",
     "data": [ ... ]
   }
```

---

## 2. Inyeccion de Dependencias en el Flujo

El ensamblaje esta centralizado en `src/config/container.js`:

```javascript
// src/config/container.js
const ticketReadModel = new TicketReadModel({ supabase: dataClient });
const getTicketsByDepartmentQuery = new GetTicketsByDepartmentQuery({ ticketReadModel });

// src/controllers/TicketQueryController.js
const { getTicketsByDepartmentQuery } = require('../config/container');
```
