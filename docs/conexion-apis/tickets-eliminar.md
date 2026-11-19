# Guía de Conexión: Eliminación de Tickets (Borrado Lógico)

Esta guía describe cómo el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de eliminación de tickets para Administradores.

---

## 1. Información del Endpoint

| Parámetro | Detalle |
| :--- | :--- |
| **Método HTTP** | `DELETE` |
| **Ruta** | `/api/tickets/:id` |
| **URL Base Local** | `http://localhost:3000` (o `http://10.0.2.2:3000` en emulador Android) |
| **Autenticación** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `administrador` |
| **Tipo de Operación CQRS** | Command (Mutación con borrado lógico) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Parámetros de Ruta (Path Parameters)

- `:id` (UUID, Obligatorio): Identificador del ticket a eliminar.  
  Ejemplo: `/api/tickets/325cc46a-6a58-4d6a-a76b-911f13afd5c6`

---

## 4. Cuerpo de la Petición (Request Body)

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

### 5.2. Errores Comunes
- **400 Bad Request:**
  - `El ID del ticket debe ser un UUID válido`
- **401 Unauthorized:**
  - `Token no proporcionado` o `Token no valido o expirado`
- **403 Forbidden:**
  - `No tienes permisos para realizar esta accion` (ej. roles `colaborador`, `gerente`, `soporte`)
- **404 Not Found:**
  - `Ticket no encontrado` (no existe o ya había sido eliminado previamente)

---

## 6. Ejemplo en Flutter (Dart)

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
  } else {
    throw Exception(body['message'] ?? 'Error al eliminar ticket');
  }
}
```
