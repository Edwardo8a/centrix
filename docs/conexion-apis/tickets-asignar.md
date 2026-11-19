# Guia de Conexion: Asignacion de Tickets

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de asignacion de tickets a tecnicos de soporte para Gerentes y Administradores.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `PATCH` |
| **Ruta** | `/api/tickets/:id/assign` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `gerente`, `administrador` |
| **Tipo de Operacion CQRS** | Command (Mutacion transaccional con notificacion push al tecnico) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Parametros de Ruta (Path Parameters)

- `:id` (UUID, Obligatorio): Identificador del ticket a asignar.  
  Ejemplo: `/api/tickets/325cc46a-6a58-4d6a-a76b-911f13afd5c6/assign`

---

## 4. Cuerpo de la Peticion (Request Body)

```json
{
  "assigned_to": "a1b2c3d4-0000-4000-8000-000000000001"
}
```

### Campos:
- **`assigned_to`** (UUID, Obligatorio): Identificador unico del usuario con rol `soporte_tecnico` al que se le adjudica la atencion de la incidencia.

---

## 5. Reglas de Negocio

1. **Estado Terminal:** No se puede asignar un ticket que ya se encuentre en estado `Cerrado` o `Rechazado` (arroja error 400).
2. **Rol del Asignado:** El usuario receptor debe tener el rol `soporte_tecnico` en la base de datos (arroja error 400 si se intenta asignar a un colaborador o gerente).
3. **Mismo Departamento:** El tecnico asignado debe pertenecer al mismo departamento al que esta canalizado el ticket.
4. **Restriccion Gerente (Anti-IDOR):** Un gerente solo puede asignar tickets que correspondan a su propio departamento.
5. **Transicion Automatica de Estado:** Si el ticket se encontraba en estado `Abierto`, al asignarse cambia automaticamente a `En progreso`.
6. **Notificacion Push:** El tecnico recibe una notificacion Push instantanea en su dispositivo movil via Firebase Cloud Messaging (FCM).

---

## 6. Respuestas del Servidor

### 6.1. Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Ticket asignado exitosamente",
  "data": {
    "ticketId": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
    "assignedTo": "a1b2c3d4-0000-4000-8000-000000000001",
    "status": "En progreso"
  }
}
```

### 6.2. Errores Comunes
- **400 Bad Request:** Formato UUID invalido, el usuario no tiene rol de soporte o no pertenece al departamento del ticket.
- **403 Forbidden:** Un usuario con rol colaborador intenta asignar, o un gerente intenta operar fuera de su departamento.
- **404 Not Found:** El ticket o el usuario tecnico no existen.

---

## 7. Ejemplo de Consumo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> assignTicket({
  required String baseUrl,
  required String token,
  required String ticketId,
  required String solverUserId,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets/$ticketId/assign');

  final response = await http.patch(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'assigned_to': solverUserId,
    }),
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 200 && body['success'] == true) {
    return true;
  } else {
    throw Exception(body['message'] ?? 'Error al asignar ticket');
  }
}
```
