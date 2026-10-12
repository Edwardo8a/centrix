# Flujo de Ejecucion HTTP: Creacion de Tickets Basicos (HU-03)

Este documento describe la ruta exacta que recorre una peticion HTTP al crear un nuevo ticket en el sistema.

---

## 1. Diagrama de la Ruta HTTP

```text
1. CLIENTE (Flutter / Web)
   Envia: POST /api/tickets
   Header: Authorization: Bearer <TOKEN>
   Body  : { title, description, priority, department_id }
      |
      v
2. ENRUTADOR (src/routes/ticketRoutes.js)
   Intercepta la ruta y aplica los middlewares en serie:
      |-- authMiddleware: Verifica y decodifica el token JWT
      |-- roleCheck: Valida roles [colaborador, gerente, administrador]
      `-- ticketValidator + validateResult: Valida campos obligatorios
      |
      v
3. CONTROLADOR (src/controllers/TicketCommandController.js)
   Desempaqueta los campos del body y crea el Command DTO:
   const command = new CreateTicketCommand({
     title, description, priority, departmentId, userId: req.user.id
   });
   Invoca: createTicketHandler.handle(command)
      |
      v
4. HANDLER DE APLICACION (src/commands/tickets/CreateTicketHandler.js)
   Instancia la entidad de dominio y delega la persistencia:
   const ticket = new Ticket({ ... });
   const result = await this.ticketRepository.create(ticket);
   return { id: result.id };
      |
      v
5. REPOSITORIO (src/repositories/TicketRepository.js)
   Ejecuta la insercion en Supabase:
   supabase.from('tickets').insert([payload]).select('id').single();
      |
      v
6. RESPUESTA HTTP (src/utils/responseBuilder.js)
   Retorna HTTP 201 Created:
   {
     "success": true,
     "message": "Ticket creado exitosamente",
     "data": { "id": "325cc46a-..." }
   }
```

---

## 2. Inyeccion de Dependencias en el Flujo

El `TicketCommandController` no conoce la base de datos ni a Supabase; unicamente recibe `createTicketHandler` inyectado desde `src/config/container.js`:

```javascript
// src/config/container.js
const ticketRepository = new TicketRepository({ supabase: dataClient });
const createTicketHandler = new CreateTicketHandler({ ticketRepository });

// src/controllers/TicketCommandController.js
const { createTicketHandler } = require('../config/container');
```
