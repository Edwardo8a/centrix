# Guía de Integración: Obtener Departamentos

Esta documentación técnica describe cómo el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de lectura de departamentos. Esto es útil, por ejemplo, para llenar un menú desplegable (dropdown) al momento de que un usuario quiera crear un nuevo ticket y deba seleccionar su departamento.

---

## 1. Información del Endpoint

| Parámetro | Detalle |
| :--- | :--- |
| **Método HTTP** | `GET` |
| **Ruta** | `/api/departments` |
| **URL Base Local** | `http://localhost:3000` (o `http://10.0.2.2:3000` en emulador Android) |
| **Autenticación** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | Todos (Cualquier usuario autenticado) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <JWT_DEL_USUARIO_AUTENTICADO>
```

---

## 3. Parámetros de Ruta o Query
Ninguno.

---

## 4. Respuestas del Servidor

### 4.1. Respuesta Exitosa (200 OK)

Ocurre cuando la petición se procesa correctamente y devuelve la lista de departamentos activos:

```json
{
  "success": true,
  "message": "Departamentos obtenidos exitosamente",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "nombre": "Recursos Humanos",
      "descripcion": "Departamento encargado del personal",
      "created_at": "2026-09-29T21:30:00.000Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "nombre": "Soporte TI",
      "descripcion": "Departamento de tecnologías de la información",
      "created_at": "2026-09-29T21:30:00.000Z"
    }
  ]
}
```

---

### 4.2. Respuestas de Error

#### 401 Unauthorized (Token inválido o ausente)
Si el cliente no envía el token o el token ya expiró:

```json
{
  "success": false,
  "message": "No se proporcionó un token de autenticación válido",
  "errors": null
}
```

---

## 5. Ejemplo de Consumo en Flutter (Dart)

El equipo de Frontend puede implementar esta llamada para poblar listas o dropdowns:

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

  if (response.statusCode == 200) {
    final body = jsonDecode(response.body);
    print('Departamentos obtenidos: ${body['data'].length}');
    return body['data']; // Retorna la lista de departamentos
  } else {
    final error = jsonDecode(response.body);
    print('Error al obtener departamentos: ${error['message']}');
    throw Exception(error['message']);
  }
}
```
