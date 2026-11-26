# Guia de Conexion: Notificaciones y Tokens de Dispositivo

Esta guia describe como el equipo de Frontend (Flutter) debe conectarse a los endpoints de notificaciones en la aplicacion Centrix. Incluye la consulta de notificaciones en app, el marcado como leidas, y el registro/baja de tokens FCM para push notifications.

---

## 1. Endpoints Disponibles

| Metodo | Ruta | Descripcion | Roles |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Obtiene las notificaciones del usuario | Todos autenticados |
| `PATCH` | `/api/notifications/:id/read` | Marca una notificacion como leida | Todos autenticados |
| `POST` | `/api/users/device-token` | Registra token FCM del dispositivo | Todos autenticados |
| `DELETE` | `/api/users/device-token` | Da de baja el token FCM del dispositivo | Todos autenticados |

---

## 2. GET /api/notifications - Obtener Notificaciones

### 2.1. Cabeceras

```http
Authorization: Bearer <TOKEN_JWT>
```

### 2.2. Query Parameters (Opcionales)

| Parametro | Tipo | Descripcion |
| :--- | :--- | :--- |
| `limit` | number | Cantidad de resultados (default: 20) |
| `offset` | number | Desplazamiento para paginacion (default: 0) |

### 2.3. Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Notificaciones obtenidas exitosamente",
  "data": [
    {
      "id": "notif-uuid",
      "user_id": "user-uuid",
      "title": "Ticket actualizado",
      "body": "El estado de tu ticket cambio a En revision",
      "read": false,
      "created_at": "2026-11-01T10:00:00.000Z"
    }
  ]
}
```

### 2.4. Ejemplo Dart

```dart
import 'package:dio/dio.dart';

Future<List<Map<String, dynamic>>> getNotifications({
  required String baseUrl,
  required String token,
  int limit = 20,
  int offset = 0,
}) async {
  final dio = Dio();
  final response = await dio.get(
    '$baseUrl/api/notifications',
    queryParameters: {'limit': limit, 'offset': offset},
    options: Options(headers: {'Authorization': 'Bearer $token'}),
  );
  if (response.statusCode == 200 && response.data['success'] == true) {
    return List<Map<String, dynamic>>.from(response.data['data']);
  }
  throw Exception(response.data['message'] ?? 'Error al obtener notificaciones');
}
```

---

## 3. PATCH /api/notifications/:id/read - Marcar como Leida

### 3.1. Cabeceras

```http
Authorization: Bearer <TOKEN_JWT>
```

### 3.2. Path Parameters

- `:id` (UUID): ID de la notificacion a marcar como leida.

### 3.3. Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Notificacion marcada como leida",
  "data": { "id": "notif-uuid" }
}
```

### 3.4. Ejemplo Dart

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> markNotificationAsRead({
  required String baseUrl,
  required String token,
  required String notificationId,
}) async {
  final url = Uri.parse('$baseUrl/api/notifications/$notificationId/read');
  final response = await http.patch(url,
    headers: {'Authorization': 'Bearer $token'},
  );
  final body = jsonDecode(response.body);
  if (response.statusCode != 200 || body['success'] != true) {
    throw Exception(body['message'] ?? 'Error al marcar notificacion');
  }
}
```

---

## 4. POST /api/users/device-token - Registrar Token FCM

Debe llamarse al iniciar sesion o al obtener un nuevo token FCM de Firebase.

### 4.1. Cabeceras

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT>
```

### 4.2. Cuerpo de la Peticion

```json
{
  "token": "fcm-device-token-string"
}
```

### 4.3. Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Token de dispositivo registrado exitosamente"
}
```

### 4.4. Ejemplo Dart

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> registerDeviceToken({
  required String baseUrl,
  required String token,
}) async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  if (fcmToken == null) return;

  final url = Uri.parse('$baseUrl/api/users/device-token');
  final response = await http.post(url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({'token': fcmToken}),
  );
  final body = jsonDecode(response.body);
  if (response.statusCode != 200 || body['success'] != true) {
    throw Exception(body['message'] ?? 'Error al registrar token FCM');
  }
}
```

---

## 5. DELETE /api/users/device-token - Dar de Baja Token FCM

Debe llamarse al cerrar sesion para dejar de recibir push notifications en ese dispositivo.

### 5.1. Cabeceras

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT>
```

### 5.2. Cuerpo de la Peticion

```json
{
  "token": "fcm-device-token-string"
}
```

### 5.3. Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Token de dispositivo eliminado exitosamente"
}
```

### 5.4. Ejemplo Dart

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> unregisterDeviceToken({
  required String baseUrl,
  required String token,
}) async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  if (fcmToken == null) return;

  final url = Uri.parse('$baseUrl/api/users/device-token');
  final response = await http.delete(url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({'token': fcmToken}),
  );
  final body = jsonDecode(response.body);
  if (response.statusCode != 200 || body['success'] != true) {
    throw Exception(body['message'] ?? 'Error al eliminar token FCM');
  }
}
```

---

## 6. Flujo Recomendado en Flutter (Ciclo de Vida FCM)

```text
Login exitoso
  --> registerDeviceToken(baseUrl, token)   // POST /api/users/device-token

App en primer plano
  --> getNotifications(baseUrl, token)      // GET /api/notifications?limit=20

Usuario toca notificacion
  --> markNotificationAsRead(id)            // PATCH /api/notifications/:id/read

Logout
  --> unregisterDeviceToken(baseUrl, token) // DELETE /api/users/device-token
```
