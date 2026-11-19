# Guia de Conexion: Eliminacion de Tickets (Borrado Logico)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de eliminacion de tickets para Administradores.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `DELETE` |
| **Ruta** | `/api/tickets/:id` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `administrador` |
| **Tipo de Operacion CQRS** | Command (Mutacion con borrado logico) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Parametros de Ruta (Path Parameters)

- `:id` (UUID, Obligatorio): Identificador del ticket a eliminar.
  Ejemplo: `/api/tickets/325cc46a-6a58-4d6a-a76b-911f13afd5c6`

---

## 4. Cuerpo de la Peticion (Request Body)

*No requiere cuerpo (body).*

---

## 5. Respuestas del Servidor

### 5.1. Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Ticket eliminado exitosamente",
  "data": {
    "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6"
  }
}
```

> **Nota:** El borrado es logico (soft delete). El registro permanece en la base de datos con el campo `deleted_at` marcado. El ticket deja de aparecer en todas las consultas que filtran `deleted_at IS NULL`.

### 5.2. Errores Comunes

| Codigo | Mensaje | Causa |
| :--- | :--- | :--- |
| `400` | `El ID del ticket debe ser un UUID valido` | El parametro `:id` no es UUID |
| `401` | `Token no proporcionado` / `Token no valido o expirado` | JWT ausente o caducado |
| `403` | `No tienes permisos para realizar esta accion` | Rol diferente a `administrador` |
| `404` | `Ticket no encontrado` | El ticket no existe o ya fue eliminado |

---

## 6. Handler y Repositorio (CQRS)

```text
DELETE /api/tickets/:id
  --> DeleteTicketCommand { ticketId }
  --> DeleteTicketHandler.handle(command)
      --> TicketRepository.softDelete(ticketId)
          --> UPDATE tickets SET deleted_at = NOW() WHERE id = ticketId
  --> 200 OK { id }
```

---

## 7. Ejemplo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> deleteTicket({
  required String baseUrl,
  required String token,
  required String ticketId,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets/$ticketId');

  final response = await http.delete(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 200 && body['success'] == true) {
    return true;
  }
  throw Exception(body['message'] ?? 'Error al eliminar ticket');
}
```
