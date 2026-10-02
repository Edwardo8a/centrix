# Guia de Conexion: Catalogo de Departamentos

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de lectura de departamentos para llenar menus desplegables (dropdowns) en la creacion o filtrado de tickets.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `GET` |
| **Ruta** | `/api/departments` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | Todos los usuarios autenticados |
| **Tipo de Operacion CQRS** | Query (Lectura optimizada) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Respuestas del Servidor

### 3.1. Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Departamentos obtenidos exitosamente",
  "data": [
    {
      "id": "0dc6ef63-a5df-4f92-804f-a097097ee005",
      "name": "Soporte TI",
      "description": "Departamento encargado del soporte a equipos de computo",
      "created_at": "2026-09-28T17:57:47+00:00"
    }
  ]
}
```

---

## 4. Ejemplo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<List<dynamic>> fetchDepartments({
  required String baseUrl,
  required String token,
}) async {
  final url = Uri.parse('$baseUrl/api/departments');

  final response = await http.get(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 200 && body['success'] == true) {
    return body['data'];
  } else {
    throw Exception(body['message'] ?? 'Error al obtener departamentos');
  }
}
```
