# Flujo de Ejecucion HTTP End-to-End: Cambio de Estado de Tickets

Este documento describe la ruta completa que recorre la peticion HTTP al cambiar el estado de un ticket, desde la vista Flutter hasta la base de datos Supabase, incluyendo la validacion de la matriz de transiciones y el envio de notificaciones FCM.

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. VISTA DE DETALLE DE TICKET (View)
   - El usuario (Gerente, Soporte Tecnico o Administrador) visualiza el ticket.
   - Selecciona el nuevo estado desde un dropdown filtrado por los estados permitidos
     segun su rol:
       soporte_tecnico --> En revision | En progreso | Resuelto
       gerente         --> toda la matriz (solo su departamento)
       administrador   --> toda la matriz (global)
   - Al confirmar, prepara la peticion PATCH:
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer <TOKEN_JWT_USUARIO>'
     }
     body: jsonEncode({ 'status': 'En revision' })
        |
        |  [HTTP PATCH /api/tickets/:id/status]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. ENRUTADOR
   src/routes/ticketRoutes.js
   - Intercepta PATCH /:id/status y aplica middlewares en serie:
     |-- authMiddleware:  Verifica JWT
     |-- roleCheck([GERENTE, SOPORTE_TECNICO, ADMINISTRADOR]): Control de acceso
     |-- param('id').isUUID(): Valida UUID del ticket
     |-- body('status').isString(): Valida que el nuevo estado sea un string
     `-- validateResult: Si hay error retorna 400 Bad Request
        |
        v
3. CONTROLADOR
   src/controllers/TicketCommandController.js  (factory function)
   - Construye el command con:
     const command = new ChangeTicketStatusCommand({
       ticketId:  req.params.id,
       newStatus: req.body.status,
       userId:    req.user.id,
       userRole:  req.user.role
     });
   - Invoca: changeTicketStatusHandler.handle(command)
        |
        v
4. HANDLER DE APLICACION (CQRS Write Side)
   src/commands/tickets/ChangeTicketStatusHandler.js
   - Obtiene el ticket actual para verificar estado actual y departamento.
   - Valida la transicion segun la matriz de TicketStatus.js:
     - Si la transicion no es permitida --> lanza BusinessError 400
   - Aplica restriccion por rol:
     - soporte_tecnico: solo puede establecer En revision, En progreso, Resuelto
     - gerente: solo tickets de su departamento (anti-IDOR)
   - Llama a ticketRepository.updateStatus(ticketId, newStatus)
   - Envia notificacion FCM via NotificationService al creador y al asignado:
     await notificationService.sendStatusChangeNotification(ticket, newStatus)
        |
        v
5. REPOSITORIO DE ESCRITURA
   src/repositories/TicketRepository.js
   - Ejecuta el PATCH en Supabase PostgreSQL:
     await this.supabase
       .from('tickets')
       .update({ status: newStatus, updated_at: new Date() })
       .eq('id', ticketId)
5b. SERVICIO DE NOTIFICACIONES
   src/services/NotificationService.js
   - Consulta los device tokens del creador y del asignado en Supabase.
   - Envia push notification via Firebase Admin SDK (FCM).
   - Registra la notificacion en la tabla `notifications` de Supabase.
   - Si Firebase no esta configurado (sin firebase-credentials.json),
     omite el push pero guarda la notificacion en BD (degradacion gracil).
        |
        v
6. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 200 OK:
     {
       "success": true,
       "message": "Estado del ticket actualizado exitosamente",
       "data": {
         "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
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
   - Actualiza el estado del ticket en la UI (ViewModel / Provider).
   - Muestra SnackBar de confirmacion con el nuevo estado.
   - Si el usuario actual es el creador o el asignado, recibe
     tambien una push notification FCM en su dispositivo.
```

---

## 2. Matriz de Transiciones de Estado

| Estado Actual | Estados Permitidos |
| :--- | :--- |
| `Abierto` | `En revision`, `En progreso`, `Cerrado`, `Rechazado` |
| `En revision` | `En progreso`, `Resuelto`, `Cerrado`, `Rechazado` |
| `En progreso` | `En revision`, `Resuelto`, `Cerrado` |
| `Resuelto` | `En progreso`, `Cerrado` |
| `Cerrado` | *(terminal - sin transiciones)* |
| `Rechazado` | *(terminal - sin transiciones)* |

---

## 3. Archivos Involucrados

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| View (Flutter) | `lib/features/tickets/presentation/pages/ticket_detail_page.dart` | Dropdown de estado y boton de actualizar |
| ViewModel (Flutter) | `lib/features/tickets/presentation/viewmodels/ticket_detail_viewmodel.dart` | Llama al repositorio y actualiza estado |
| Repository (Flutter) | `lib/features/tickets/data/repositories/ticket_repository.dart` | Llamada HTTP PATCH |
| Enrutador | `src/routes/ticketRoutes.js` | Define `PATCH /:id/status` con middlewares |
| Controlador | `src/controllers/TicketCommandController.js` | Construye el Command |
| Command | `src/commands/tickets/ChangeTicketStatusCommand.js` | DTO con ticketId, newStatus, userId, userRole |
| Handler | `src/commands/tickets/ChangeTicketStatusHandler.js` | Valida transicion, actualiza, notifica |
| Enum | `src/enums/TicketStatus.js` | Matriz de transiciones permitidas |
| Repository | `src/repositories/TicketRepository.js` | Actualiza `status` en tabla `tickets` |
| Notifications | `src/services/NotificationService.js` | Push FCM + registro en tabla `notifications` |

---

## 4. Ejemplo Dart (Flutter)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> changeTicketStatus({
  required String baseUrl,
  required String token,
  required String ticketId,
  required String newStatus,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets/$ticketId/status');

  final response = await http.patch(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({'status': newStatus}),
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 200 && body['success'] == true) {
    return; // exito
  }
  throw Exception(body['message'] ?? 'Error al cambiar estado');
}
```
