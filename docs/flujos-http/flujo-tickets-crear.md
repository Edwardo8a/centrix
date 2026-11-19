# Flujo de Ejecucion HTTP End-to-End: Creacion de Tickets Basicos (HU-03)

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP al crear un nuevo ticket en el sistema, detallando la interaccion tanto desde el cliente Frontend (Flutter / Web) como en el Backend (CQRS y SOLID).

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. VISTA DE CREACION (View)
   - El usuario (Colaborador, Gerente o Administrador) completa el formulario:
     * Titulo de la incidencia
     * Descripcion detallada
     * Prioridad (Baja, Media, Alta, Critica)
     * Departamento asignado (seleccionado desde el dropdown poblado via GET /api/departments)
   - Al enviar el formulario, el cliente prepara la llamada HTTP:
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer <TOKEN_JWT_USUARIO>'
     }
     body: jsonEncode({
       'title': title,
       'description': description,
       'priority': priority,
       'department_id': selectedDepartmentId
     })
        |
        |  [HTTP POST /api/tickets]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. ENRUTADOR
   src/routes/ticketRoutes.js
   - Intercepta la ruta POST / y aplica los middlewares en serie:
     |-- authMiddleware: Verifica la firma y vigencia del JWT (extrae req.user.id)
     |-- roleCheck: Valida que el rol sea [colaborador, gerente, administrador]
     |-- ticketValidator: Valida campos requeridos (title, description, priority, department_id)
     `-- validateResult: Si hay error retorna 400 Bad Request; si es valido continua
        |
        v
3. CONTROLADOR
   src/controllers/TicketCommandController.js
   - Desempaqueta req.body y el id del usuario autenticado (req.user.id):
     const command = new CreateTicketCommand({
       title: req.body.title,
       description: req.body.description,
       priority: req.body.priority,
       departmentId: req.body.department_id,
       userId: req.user.id
     });
   - Invoca: createTicketHandler.handle(command)
        |
        v
4. HANDLER DE APLICACION (CQRS Write Side)
   src/commands/tickets/CreateTicketHandler.js
   - Instancia la entidad de dominio Ticket con los datos validados:
     const ticket = new Ticket({
       title: command.title,
       description: command.description,
       priority: command.priority,
       department_id: command.departmentId,
       created_by: command.userId
     });
   - Delega la persistencia al repositorio:
     const result = await this.ticketRepository.create(ticket);
     return { id: result.id };
        |
        v
5. REPOSITORIO DE ESCRITURA
   src/repositories/TicketRepository.js
   - Ejecuta la insercion directa en Supabase PostgreSQL:
     const { data, error } = await this.supabase
       .from('tickets')
       .insert([ticketData])
       .select('id')
       .single();
        |
        v
6. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 201 Created:
     {
       "success": true,
       "message": "Ticket creado exitosamente",
       "data": {
         "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6"
       }
     }
        |
        |  [HTTP 201 Created Response]
        v
========================================================================================
                               FRONTEND (PROCESAMIENTO)
========================================================================================
7. RECEPCION Y ACTUALIZACION EN FLUTTER
   - El cliente recibe el statusCode 201 y el identificador generado (`id`).
   - Muestra notificacion de exito (SnackBar / Dialog) al colaborador.
   - Limpia el formulario y redirige al listado de tickets o al Dashboard.
```

---

## 2. Inyeccion de Dependencias en el Flujo Backend

El `TicketCommandController` no conoce los detalles de la base de datos ni a Supabase; unicamente recibe `createTicketHandler` inyectado desde el Composition Root (`src/config/container.js`):

```javascript
// src/config/container.js
const ticketRepository = new TicketRepository({ supabase: dataClient });
const createTicketHandler = new CreateTicketHandler({ ticketRepository });

// src/controllers/TicketCommandController.js
const { createTicketHandler } = require('../config/container');
```
