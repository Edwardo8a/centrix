# Guia de Conexion: Evidencias de Tickets (Validacion Binaria y URLs Firmadas)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al modulo especializado de evidencias de tickets (`/api/tickets/:ticketId/evidences`).

A diferencia de los adjuntos generales, este modulo cuenta con:
1. **Validacion de Magic Bytes:** Comprobacion binaria real en el buffer del archivo para evitar spoofing de extensiones (JPEG, PNG o MP4 exclusivamente).
2. **URLs Firmadas Temporales (*Signed URLs*):** Acceso seguro por tiempo limitado para visualizacion directa.
3. **Control de Acceso Estricto (*TicketEvidenceAccessPolicy*):** Solo el creador, el asignado, el gerente del departamento o el administrador pueden interactuar.

---

## 1. Informacion de los Endpoints

| Metodo | Ruta | Roles Autorizados | Descripcion |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/tickets/:ticketId/evidences` | colaborador, gerente, admin | Subir evidencia valida (imagen o video) |
| `GET` | `/api/tickets/:ticketId/evidences` | colaborador, soporte, gerente, admin | Listar evidencias con URLs firmadas |
| `GET` | `/api/tickets/pending` | gerente, administrador | Listar tickets pendientes de atencion |

---

## 2. Tipos y Limites Permitidos

- **Formatos:** `image/jpeg` (.jpg, .jpeg), `image/png` (.png), `video/mp4` (.mp4).
- **Tamano maximo:** 5 MB por archivo.
- **Validacion:** Si el archivo se renombra pero su cabecera binaria no coincide, se rechaza con `400 Bad Request`.

---

## 3. POST /api/tickets/:ticketId/evidences - Subir Evidencia

### 3.1 Cabeceras
```http
Authorization: Bearer <TOKEN_JWT>
Content-Type: multipart/form-data
```

### 3.2 Cuerpo de la Peticion (multipart/form-data)
- `file`: Archivo binario (JPEG, PNG o MP4).

### 3.3 Respuesta Exitosa (201 Created)
```json
{
  "success": true,
  "message": "Evidencia guardada",
  "data": {
    "evidenceId": "evidencia-uuid-1234",
    "ticketId": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
    "mimeType": "image/jpeg",
    "size": 245890,
    "createdAt": "2026-11-17T20:41:23.000Z",
    "signedUrl": "https://tu-proyecto.supabase.co/storage/v1/object/sign/evidences/...?token=..."
  }
}
```

---

## 4. GET /api/tickets/:ticketId/evidences - Consultar Evidencias

### 4.1 Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Evidencias obtenidas",
  "data": [
    {
      "id": "evidencia-uuid-1234",
      "ticket_id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
      "mime_type": "image/jpeg",
      "size_bytes": 245890,
      "created_at": "2026-11-17T20:41:23.000Z",
      "signed_url": "https://tu-proyecto.supabase.co/storage/v1/object/sign/evidences/...?token=..."
    }
  ]
}
```

---

## 5. Ejemplo en Flutter (Dart)

```dart
import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> uploadTicketEvidence({
  required String baseUrl,
  required String token,
  required String ticketId,
  required File file,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets/$ticketId/evidences');

  final request = http.MultipartRequest('POST', url)
    ..headers['Authorization'] = 'Bearer $token'
    ..files.add(await http.MultipartFile.fromPath('file', file.path));

  final streamedResponse = await request.send();
  final response = await http.Response.fromStream(streamedResponse);
  final body = jsonDecode(response.body);

  if (response.statusCode == 201 && body['success'] == true) {
    return Map<String, dynamic>.from(body['data']);
  }
  throw Exception(body['message'] ?? 'Error al subir evidencia');
}
```
