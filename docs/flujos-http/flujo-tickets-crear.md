# Flujo de Ejecucion HTTP End-to-End: Creacion de Tickets (HU-03)

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP al crear un nuevo ticket en el sistema, detallando la interaccion tanto desde el cliente Frontend (Flutter) como en el Backend (CQRS y SOLID).

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
     * Departamento (seleccionado desde el dropdown via GET /api/departments)
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
     |-- authMiddleware:  Verifica la firma y vigencia del JWT (extrae req.user.id)
     |-- roleCheck:       Valida que el rol sea [colaborador, gerente, administrador]
     |-- ticketValidator: Valida campos requeridos (title, description, priority, department_id)
     `-- validateResult:  Si hay error retorna 400 Bad Request; si es valido continua
        |
        v
3. CONTROLADOR
   src/controllers/TicketCommandController.js  (factory function)
   - Desempaqueta req.body y el id del usuario autenticado (req.user.id):
     const command = new CreateTicketCommand({
       title:        req.body.title,
       description:  req.body.description,
       priority:     req.body.priority,
       departmentId: req.body.department_id,
       userId:       req.user.id
     });
   - Invoca: createTicketHandler.handle(command)
        |
        v
4. HANDLER DE APLICACION (CQRS Write Side)
   src/commands/tickets/CreateTicketHandler.js
   - Instancia la entidad de dominio Ticket con los datos validados:
     const ticket = new Ticket({
       title:        command.title,
       description:  command.description,
       priority:     command.priority,
       department_id: command.departmentId,
       created_by:   command.userId
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
   - El cliente recibe el statusCode 201 y el identificador generado (id).
   - Muestra notificacion de exito (SnackBar / Dialog) al colaborador.
   - Limpia el formulario y redirige al listado de tickets o al Dashboard.
```

---

## 2. Archivos Involucrados

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| View (Flutter) | `lib/features/tickets/presentation/pages/create_ticket_page.dart` | Formulario de creacion |
| ViewModel (Flutter) | `lib/features/tickets/presentation/viewmodels/create_ticket_viewmodel.dart` | Estado del formulario y llamada |
| Repository (Flutter) | `lib/features/tickets/data/repositories/ticket_repository.dart` | Llamada HTTP POST |
| Enrutador | `src/routes/ticketRoutes.js` | Define `POST /api/tickets` con middlewares |
| Controlador | `src/controllers/TicketCommandController.js` | Construye el Command y llama al handler |
| Command | `src/commands/tickets/CreateTicketCommand.js` | DTO inmutable con datos del formulario |
| Handler | `src/commands/tickets/CreateTicketHandler.js` | Orquesta creacion y persistencia |
| Entidad | `src/models/Ticket.js` | Modelo de dominio |
| Repository | `src/repositories/TicketRepository.js` | Insercion en tabla `tickets` |
| Response Builder | `src/utils/responseBuilder.js` | Formato estandar de respuesta |

---

## 3. Inyeccion de Dependencias en el Flujo Backend

```javascript
// src/config/container.js
const ticketRepository   = new TicketRepository({ supabase: adminClient });
const createTicketHandler = new CreateTicketHandler({ ticketRepository });

const ticketCommandController = ticketCommandControllerFactory({
  createTicketHandler,
  // ... otros handlers
});
```

---

## 4. Ejemplo Dart (Flutter)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<String> createTicket({
  required String baseUrl,
  required String token,
  required String title,
  required String description,
  required String priority,
  required String departmentId,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets');

  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'title': title,
      'description': description,
      'priority': priority,
      'department_id': departmentId,
    }),
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 201 && body['success'] == true) {
    return body['data']['id'] as String;
  }
  throw Exception(body['message'] ?? 'Error al crear ticket');
}
```
