# Flujo de Ejecucion HTTP End-to-End: Asignacion de Tickets

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP al asignar un agente de soporte tecnico a un ticket, incluyendo la validacion de departamento, el cambio automatico de estado y el envio de notificacion FCM al asignado.

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. VISTA DE DETALLE / ASIGNACION (View)
   - El Gerente o Administrador visualiza un ticket sin asignar.
   - Presiona el boton "Asignar" que despliega un dropdown con los agentes
     de soporte tecnico del departamento (cargados via GET /api/users/solvers).
   - Selecciona al agente y confirma la asignacion.
   - Prepara la peticion PATCH:
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer <TOKEN_JWT_GERENTE_O_ADMIN>'
     }
     body: jsonEncode({ 'assignee_id': 'UUID-del-agente' })
        |
        |  [HTTP PATCH /api/tickets/:id/assign]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. ENRUTADOR
   src/routes/ticketRoutes.js
   - Intercepta PATCH /:id/assign y aplica middlewares en serie:
     |-- authMiddleware:  Verifica JWT
     |-- roleCheck([GERENTE, ADMINISTRADOR]): Control de acceso por rol
     |-- param('id').isUUID(): Valida UUID del ticket
     |-- body('assignee_id').isUUID(): Valida UUID del agente a asignar
     `-- validateResult: Si hay error retorna 400 Bad Request
        |
        v
3. CONTROLADOR
   src/controllers/TicketCommandController.js  (factory function)
   - Construye el command con:
     const command = new AssignTicketCommand({
       ticketId:      req.params.id,
       assigneeId:    req.body.assignee_id,
       requesterId:   req.user.id,
       requesterRole: req.user.role
     });
   - Invoca: assignTicketHandler.handle(command)
        |
        v
4. HANDLER DE APLICACION (CQRS Write Side)
   src/commands/tickets/AssignTicketHandler.js
   - Verifica que el ticket exista y no este en estado terminal (Cerrado/Rechazado).
   - Valida que el assigneeId pertenezca al departamento del ticket
     (consulta via userReadModel para anti-IDOR):
     const solver = await this.userReadModel.getUserById(assigneeId);
     if (solver.department_id !== ticket.department_id) --> BusinessError 403
   - Asigna el ticket y cambia el estado automaticamente a "En revision":
     await this.ticketRepository.assignTicket(ticketId, assigneeId);
   - Envia notificacion FCM al nuevo asignado via NotificationService:
     await notificationService.sendAssignmentNotification(ticket, solver)
        |
        v
5. REPOSITORIO DE ESCRITURA
   src/repositories/TicketRepository.js
   - Ejecuta el PATCH en Supabase PostgreSQL:
     await this.supabase
       .from('tickets')
       .update({
         assigned_to: assigneeId,
         status: 'En revision',
         updated_at: new Date()
       })
       .eq('id', ticketId)
5b. SERVICIO DE NOTIFICACIONES
   src/services/NotificationService.js
   - Consulta el device token del agente asignado en Supabase.
   - Envia push notification via Firebase Admin SDK (FCM) informando
     que se le asigno un nuevo ticket.
   - Registra la notificacion en la tabla `notifications`.
        |
        v
6. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 200 OK:
     {
       "success": true,
       "message": "Ticket asignado exitosamente",
       "data": {
         "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
         "assigned_to": "UUID-del-agente",
         "status": "En revision"
       }
     }
        |
        |  [HTTP 200 OK Response]
        v
========================================================================================
                               FRONTEND (PROCESAMIENTO)
========================================================================================
7. RECEPCION Y ACTUALIZACION EN FLUTTER
   - Actualiza el ViewModel con el agente asignado y el nuevo estado.
   - Muestra SnackBar de confirmacion.
   - El agente asignado recibe una push notification FCM en su dispositivo.
```

---

## 2. Archivos Involucrados

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| View (Flutter) | `lib/features/tickets/presentation/pages/ticket_detail_page.dart` | Boton y dropdown de asignacion |
| ViewModel (Flutter) | `lib/features/tickets/presentation/viewmodels/ticket_detail_viewmodel.dart` | Llama al repositorio y actualiza estado |
| Repository (Flutter) | `lib/features/tickets/data/repositories/ticket_repository.dart` | Llamada HTTP PATCH y GET solvers |
| Enrutador | `src/routes/ticketRoutes.js` | Define `PATCH /:id/assign` con middlewares |
| Controlador | `src/controllers/TicketCommandController.js` | Construye el Command |
| Command | `src/commands/tickets/AssignTicketCommand.js` | DTO con ticketId, assigneeId, requesterId, requesterRole |
| Handler | `src/commands/tickets/AssignTicketHandler.js` | Valida departamento, asigna, cambia estado, notifica |
| ReadModel | `src/repositories/UserReadModel.js` | Verifica que el agente pertenezca al departamento |
| Repository | `src/repositories/TicketRepository.js` | Actualiza `assigned_to` y `status` |
| Notifications | `src/services/NotificationService.js` | Push FCM + registro en tabla `notifications` |

---

## 3. Flujo de Carga de Agentes Disponibles

Antes de asignar, el frontend carga la lista de agentes del departamento:

```text
Flutter (AssignDialog) --> GET /api/users/solvers?department_id=UUID
                      --> GetDepartmentSolversHandler
                      --> UserReadModel.getSolversByDepartment(departmentId)
                      --> [ { id, full_name, email }, ... ]
```

---

## 4. Ejemplo Dart (Flutter)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> assignTicket({
  required String baseUrl,
  required String token,
  required String ticketId,
  required String assigneeId,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets/$ticketId/assign');

  final response = await http.patch(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({'assignee_id': assigneeId}),
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 200 && body['success'] == true) {
    return; // exito
  }
  throw Exception(body['message'] ?? 'Error al asignar ticket');
}
```
