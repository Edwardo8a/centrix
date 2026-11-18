# Guia de Conexion: Actualizacion de Estado de Tickets (HU-05)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de cambio de estado de tickets para Administradores, Gerentes y Tecnicos de Soporte.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `PATCH` |
| **Ruta** | `/api/tickets/:id/status` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `gerente`, `soporte_tecnico`, `administrador` |
| **Tipo de Operacion CQRS** | Command (Mutacion transaccional con historial y notificacion) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Parametros de Ruta (Path Parameters)

- `:id` (UUID, Obligatorio): Identificador del ticket a modificar.  
  Ejemplo: `/api/tickets/325cc46a-6a58-4d6a-a76b-911f13afd5c6/status`

---

## 4. Cuerpo de la Peticion (Request Body)

```json
{
  "status": "Resuelto",
  "comment": "Se sustituyo la memoria RAM defectuosa por un modulo de 16GB",
  "resolution_notes": "Equipo probado y operativo al 100%"
}
```

### Campos:
- **`status`** (String, Obligatorio): Nuevo estado. Valores canonicos:
  - `"Abierto"`
  - `"En revision"`
  - `"En progreso"`
  - `"Resuelto"`
  - `"Cerrado"`
  - `"Rechazado"`
  *(El backend normaliza automaticamente mayusculas, minusculas, tildes y guiones bajos).*
- **`comment`** (String, Opcional): Comentario explicativo que se registra en la tabla de historial de auditoria `ticket_status_history`.
- **`resolution_notes`** (String, Condicional): Obligatorio cuando el nuevo estado es `"Resuelto"`.

---

## 5. Reglas de Negocio y Transiciones Permitidas

### 5.1. Matriz de Transiciones
| Estado Actual | Estados Hacia Donde Puede Moverse |
| :--- | :--- |
| **Abierto** | `En revision`, `En progreso`, `Cerrado`, `Rechazado` |
| **En revision** | `En progreso`, `Resuelto`, `Cerrado`, `Rechazado` |
| **En progreso** | `En revision`, `Resuelto`, `Cerrado` |
| **Resuelto** | `En progreso` (reapertura por disconformidad), `Cerrado` |
| **Cerrado** | *Ninguno (Estado Terminal)* |
| **Rechazado** | *Ninguno (Estado Terminal)* |

### 5.2. Reglas por Rol de Usuario
- **`soporte_tecnico`:** Solo tiene permitido mover el ticket a: `En revision`, `En progreso` y `Resuelto`. No puede cerrar ni rechazar tickets.
- **`gerente`:** Puede mover a cualquier estado valido dentro de su departamento (anti-IDOR protegido).
- **`administrador`:** Permiso global en todos los tickets.

---

## 6. Respuestas del Servidor

### 6.1. Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Estado del ticket actualizado exitosamente",
  "data": {
    "ticketId": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
    "previousStatus": "En progreso",
    "newStatus": "Resuelto",
    "updatedAt": "2026-11-12T18:30:00.000Z"
  }
}
```

### 6.2. Errores Comunes
- **400 Bad Request:** Estado no valido, transicion no permitida por la matriz, o falta `resolution_notes` al resolver.
- **403 Forbidden:** El rol no tiene permiso para la transicion, o el gerente intenta modificar un ticket fuera de su departamento.
- **404 Not Found:** El ticket no existe o se encuentra eliminado (borrado logico).

---

## 7. Ejemplo de Consumo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> changeTicketStatus({
  required String baseUrl,
  required String token,
  required String ticketId,
  required String newStatus,
  String? comment,
  String? resolutionNotes,
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
      'comment': comment ?? 'Cambio de estado desde aplicacion',
      if (resolutionNotes != null) 'resolution_notes': resolutionNotes,
    }),
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 200 && body['success'] == true) {
    return true;
  } else {
    throw Exception(body['message'] ?? 'Error al cambiar estado');
  }
}
```
