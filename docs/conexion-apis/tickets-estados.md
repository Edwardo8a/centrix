# Guía de Conexión: Actualización de Estado de Tickets (HU-05)

Esta guía describe cómo el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de cambio de estado de tickets para Administradores y Gerentes.

---

## 1. Información del Endpoint

| Parámetro | Detalle |
| :--- | :--- |
| **Método HTTP** | `PATCH` |
| **Ruta** | `/api/tickets/:id/status` |
| **URL Base Local** | `http://localhost:3000` (o `http://10.0.2.2:3000` en emulador Android) |
| **Autenticación** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `gerente`, `administrador` |
| **Tipo de Operación CQRS** | Command (Mutación transaccional con auditoría) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Parámetros de Ruta (Path Parameters)

- `:id` (UUID, Obligatorio): Identificador del ticket a modificar.  
  Ejemplo: `/api/tickets/325cc46a-6a58-4d6a-a76b-911f13afd5c6/status`

---

## 4. Cuerpo de la Petición (Request Body)

```json
{
  "status": "En revision",
  "comment": "Iniciando revisión técnica del equipo"
}
```

### Campos:
- **`status`** (String, Obligatorio): Nuevo estado al que transiciona el ticket. Admite:
  - `"Abierto"`
  - `"En revision"`
  - `"En progreso"`
  - `"Resuelto"`
  - `"Cerrado"`
  *(El backend normaliza automáticamente variantes como "en_revision", "En revisión", "en progreso", etc.)*
- **`comment`** (String, Opcional, pero **Obligatorio cuando el nuevo estado es "Cerrado"**): Motivo del cambio que se almacena en el historial de auditoría `ticket_status_history`.

---

## 5. Matriz de Transiciones Permitidas

El ciclo de vida del ticket se rige por las siguientes transiciones:
- **Abierto** &rarr; En revision, En progreso, Cerrado
- **En revision** &rarr; En progreso, Resuelto, Cerrado
- **En progreso** &rarr; En revision, Resuelto, Cerrado
- **Resuelto** &rarr; En progreso, Cerrado
- **Cerrado** &rarr; *(Estado terminal, no admite transiciones)*

---

## 6. Respuestas del Servidor

### 6.1. Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Estado del ticket actualizado exitosamente",
  "data": {
    "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
    "previousStatus": "Abierto",
    "status": "En revision"
  }
}
```

### 6.2. Errores Comunes
- **400 Bad Request:**
  - `El ID del ticket debe ser un UUID válido`
  - `El estado es obligatorio` / `El estado debe ser una cadena de texto`
  - `Estado de ticket no válido`
  - `El comentario es obligatorio para cerrar el ticket`
- **401 Unauthorized:**
  - `Token no proporcionado` o `Token no valido o expirado`
- **403 Forbidden:**
  - `No tienes permisos para realizar esta accion` (ej. rol `colaborador`)
- **404 Not Found:**
  - `Ticket no encontrado` (no existe o fue eliminado)
- **409 Conflict:**
  - `El ticket ya se encuentra en ese estado`
  - `No se permite la transición de estado de "<actual>" a "<solicitado>"`
  - `El ticket cambió de estado, vuelve a intentarlo` (concurrencia)

---

## 7. Ejemplo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>?> updateTicketStatus({
  required String baseUrl,
  required String token,
  required String ticketId,
  required String newStatus,
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
      'status': newStatus,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
    }),
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 200 && body['success'] == true) {
    return body['data'];
  } else {
    throw Exception(body['message'] ?? 'Error al actualizar estado del ticket');
  }
}
```
