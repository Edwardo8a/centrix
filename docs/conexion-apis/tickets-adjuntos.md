# Guia de Conexion: Adjuntos de Tickets

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint para subir archivos adjuntos a un ticket existente.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `POST` |
| **Ruta** | `/api/tickets/:id/attachments` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | Todos los roles autenticados |
| **Tipo de Operacion CQRS** | Command (Escritura con upload a Supabase Storage) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
Content-Type: multipart/form-data
```

> **Importante:** No establecer `Content-Type` manualmente si se usa `http.MultipartRequest` o `dio` con `FormData`; el cliente HTTP lo agrega automaticamente con el `boundary` correcto.

---

## 3. Parametros de Ruta (Path Parameters)

- `:id` (UUID, Obligatorio): Identificador del ticket al que se adjunta el archivo.
  Ejemplo: `/api/tickets/325cc46a-6a58-4d6a-a76b-911f13afd5c6/attachments`

---

## 4. Cuerpo de la Peticion (Request Body - multipart/form-data)

| Campo | Tipo | Obligatorio | Descripcion |
| :--- | :--- | :--- | :--- |
| `file` | Archivo binario | Si | El archivo a adjuntar (imagen, PDF, etc.) |

---

## 5. Respuestas del Servidor

### 5.1. Respuesta Exitosa (201 Created)

```json
{
  "success": true,
  "message": "Archivo adjunto agregado exitosamente",
  "data": {
    "id": "adjunto-uuid",
    "ticket_id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
    "file_url": "https://supabase.co/storage/v1/object/public/attachments/tickets/325cc46a/archivo.pdf",
    "created_at": "2026-10-01T20:00:00.000Z"
  }
}
```

### 5.2. Errores Comunes

| Codigo | Mensaje | Causa |
| :--- | :--- | :--- |
| `400` | `El ID del ticket debe ser un UUID valido` | Path param `:id` no es UUID |
| `400` | `No se proporciono ningun archivo` | Campo `file` ausente en el body |
| `401` | `Token no proporcionado` / `Token no valido o expirado` | JWT ausente o caducado |
| `404` | `Ticket no encontrado` | El ticket no existe o fue eliminado |

---

## 6. Handler y Repositorio (CQRS)

```text
POST /api/tickets/:id/attachments
  --> AddTicketAttachmentCommand { ticketId, fileData, userId }
  --> AddTicketAttachmentHandler.handle(command)
      --> TicketRepository.addAttachment(ticketId, fileData)
          --> Supabase Storage: upload file --> file_url
          --> INSERT INTO ticket_attachments (ticket_id, file_url, ...)
  --> 201 Created { id, ticket_id, file_url }
```

---

## 7. Ejemplo en Flutter (Dart)

```dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<String> addTicketAttachment({
  required String baseUrl,
  required String token,
  required String ticketId,
  required File file,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets/$ticketId/attachments');

  final request = http.MultipartRequest('POST', url)
    ..headers['Authorization'] = 'Bearer $token'
    ..files.add(await http.MultipartFile.fromPath('file', file.path));

  final streamedResponse = await request.send();
  final response = await http.Response.fromStream(streamedResponse);
  final body = jsonDecode(response.body);

  if (response.statusCode == 201 && body['success'] == true) {
    return body['data']['file_url'] as String;
  }
  throw Exception(body['message'] ?? 'Error al subir adjunto');
}
```
