# Guia de Integracion: Actualizacion de Estados de Tickets (HU-05)

Esta documentacion tecnica describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de cambio de estado de tickets correspondiente a la Historia de Usuario **HU-05 (PPS-14)** y sus subtareas:
- **PPS-90**: Cambio de estado a 'En revision'.
- **PPS-91**: Notificacion automatica al usuario creador de la incidencia.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `PATCH` |
| **Ruta** | `/api/tickets/:ticketId/status` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `administrador`, `gerente`, `soporte_tecnico`, `soporte` |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <JWT_DEL_USUARIO_AUTENTICADO>
```

---

## 3. Parametros de Ruta (Path Parameters)

- `:ticketId` (UUID, Obligatorio): Identificador unico del ticket que se desea actualizar.  
  Ejemplo: `/api/tickets/325cc46a-6a58-4d6a-a76b-911f13afd5c6/status`

---

## 4. Cuerpo de la Peticion (Request Body)

```json
{
  "status": "En revision",
  "comment": "Iniciando revision tecnica del equipo de computo"
}
```

### Descripcion de Campos:
- **`status`** (String, Obligatorio): Estado al cual transicionara el ticket.
  - Valores canonicos admitidos:
    - `"Abierto"`
    - `"En revision"` *(Requerido por HU-05 / PPS-90)*
    - `"En progreso"`
    - `"Resuelto"`
    - `"Cerrado"`
  - *Nota:* El backend normaliza automaticamente formatos comunes como `"en_revision"`, `"En revision"` o `"En revisión"`.
- **`comment`** o **`comentario`** (String, Opcional): Justificacion o motivo del cambio de estado. Se guarda directamente en la tabla de historial de auditoria (`ticket_status_history` / `ticket_historial_estados`).

---

## 5. Respuestas del Servidor

### 5.1. Respuesta Exitosa (200 OK)

Ocurre cuando el ticket se actualizo, se guardo la fila en el historial de estados y se notifico al creador:

```json
{
  "success": true,
  "message": "Estado del ticket actualizado exitosamente",
  "data": {
    "ticket": {
      "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
      "title": "Falla en equipo de computo",
      "description": "Mi computadora no enciende desde la mañana",
      "priority": "Alta",
      "status": "En revision",
      "created_by": "9942c9bf-0764-4724-a624-cc1f077d6b23",
      "assigned_to": null,
      "updated_at": "2026-09-29T21:30:00.000Z"
    },
    "previousStatus": "Abierto",
    "newStatus": "En revision",
    "creatorNotified": true,
    "notification": {
      "userId": "9942c9bf-0764-4724-a624-cc1f077d6b23",
      "title": "Actualizacion de estado: Ticket \"Falla en equipo de computo\"",
      "message": "Tu ticket \"Falla en equipo de computo\" ha cambiado a estado \"En revision\". El equipo de soporte tecnico esta analizando tu incidencia.",
      "delivered": true,
      "timestamp": "2026-09-29T21:30:00.123Z"
    }
  }
}
```

---

### 5.2. Respuestas de Error

#### 400 Bad Request (Transicion o estado no valido)
Si el estado no existe o el ticket ya esta en ese estado:

```json
{
  "success": false,
  "message": "El ticket ya se encuentra en estado \"En revision\"",
  "errors": null
}
```

O si el ticket ya habia sido cerrado previamente:
```json
{
  "success": false,
  "message": "No se puede cambiar el estado de un ticket que ya ha sido cerrado",
  "errors": null
}
```

#### 403 Forbidden (Rol no autorizado)
Si un usuario con rol de `colaborador` intenta invocar el endpoint:

```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta accion",
  "errors": null
}
```

#### 404 Not Found (Ticket inexistente)
```json
{
  "success": false,
  "message": "El ticket especificado no existe",
  "errors": null
}
```

---

## 6. Ejemplo de Consumo en Flutter (Dart)

El equipo de Frontend puede implementar esta llamada dentro de su capa de datos o repositorio de tickets:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> updateTicketStatusToUnderReview({
  required String baseUrl,
  required String token,
  required String ticketId,
  String? comment,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets/$ticketId/status');

  final response = await http.patch(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'status': 'En revision',
      'comment': comment ?? 'Cambio de estado realizado desde la aplicacion',
    }),
  );

  if (response.statusCode == 200) {
    final body = jsonDecode(response.body);
    print('Estado actualizado con exito: ${body['data']['newStatus']}');
    return true;
  } else {
    final error = jsonDecode(response.body);
    print('Error al actualizar estado: ${error['message']}');
    return false;
  }
}
```
