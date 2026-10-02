# Guia de Conexion: Actualizacion de Estados de Tickets (HU-05)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de cambio de estado de tickets para Administradores, Gerentes y Soporte Tecnico.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `PATCH` |
| **Ruta** | `/api/tickets/:ticketId/status` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `administrador`, `gerente`, `soporte_tecnico`, `soporte` |
| **Tipo de Operacion CQRS** | Command (Mutacion con registro de auditoria y notificacion) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Parametros de Ruta (Path Parameters)

- `:ticketId` (UUID, Obligatorio): Identificador del ticket a modificar.  
  Ejemplo: `/api/tickets/325cc46a-6a58-4d6a-a76b-911f13afd5c6/status`

---

## 4. Cuerpo de la Peticion (Request Body)

```json
{
  "status": "En revision",
  "comment": "Iniciando revision tecnica del equipo"
}
```

### Campos:
- **`status`** (String, Obligatorio): Nuevo estado. Admite:
  - `"Abierto"`
  - `"En revision"` *(Requerido por HU-05)*
  - `"En progreso"`
  - `"Resuelto"`
  - `"Cerrado"`
  *(El backend normaliza automaticamente cadenas como "en_revision", "En revisión", etc.)*
- **`comment`** o **`comentario`** (String, Opcional): Motivo del cambio que se almacena en la tabla de historial de auditoria.

---

## 5. Respuestas del Servidor

### 5.1. Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Estado del ticket actualizado exitosamente",
  "data": {
    "ticket": {
      "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
      "title": "Falla en equipo de computo",
      "status": "En revision",
      "updated_at": "2026-10-01T21:30:00.000Z"
    },
    "previousStatus": "Abierto",
    "newStatus": "En revision",
    "creatorNotified": true
  }
}
```

### 5.2. Errores Frecuentes
- **400 Bad Request:** Estado invalido, ticket ya en ese estado, o ticket cerrado.
- **403 Forbidden:** El usuario autenticado es colaborador y no tiene permiso.
- **404 Not Found:** El identificador del ticket no existe.

---

## 6. Ejemplo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> updateTicketStatus({
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
      'comment': comment ?? 'Actualizacion desde aplicacion',
    }),
  );

  final body = jsonDecode(response.body);
  return response.statusCode == 200 && body['success'] == true;
}
```
