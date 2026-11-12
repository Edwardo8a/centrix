# Guia de Conexion: Consulta de Tickets por Departamento

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint para obtener los tickets de un departamento especifico. Este endpoint utiliza un **query parameter**, no un path parameter.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `GET` |
| **Ruta** | `/api/tickets/department` |
| **Query Param** | `?department_id=UUID` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `gerente`, `administrador` |
| **Tipo de Operacion CQRS** | Query (Lectura con JOINs) |

> Para documentacion completa de todas las consultas de tickets, ver [tickets-consultas.md](./tickets-consultas.md).

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Query Parameters

| Parametro | Tipo | Obligatorio | Descripcion |
| :--- | :--- | :--- | :--- |
| `department_id` | UUID | Si | ID del departamento a consultar |

**Ejemplo de URL completa:**
```
GET http://localhost:3001/api/tickets/department?department_id=0dc6ef63-1234-5678-abcd-ef0123456789
```

---

## 4. Respuestas del Servidor

### 4.1. Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Tickets del departamento obtenidos exitosamente",
  "data": [
    {
      "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
      "title": "Falla en equipo de computo",
      "description": "El monitor no enciende desde ayer",
      "priority": "Alta",
      "status": "Abierto",
      "department_id": "0dc6ef63-1234-5678-abcd-ef0123456789",
      "created_at": "2026-10-01T20:00:00.000Z",
      "updated_at": "2026-10-01T20:00:00.000Z",
      "created_by": {
        "id": "9942c9bf-...",
        "full_name": "Eduardo Ochoa Almaraz",
        "email": "usuario@correo.com"
      },
      "assigned_to": null
    }
  ]
}
```

### 4.2. Errores Comunes

| Codigo | Mensaje | Causa |
| :--- | :--- | :--- |
| `400` | `department_id debe ser un UUID valido` | El query param no es UUID |
| `401` | `Token no proporcionado` / `Token no valido o expirado` | JWT ausente o caducado |
| `403` | `No tienes permisos para realizar esta accion` | Rol no autorizado |

---

## 5. Ejemplo en Flutter (Dart)

```dart
import 'package:dio/dio.dart';

Future<List<Map<String, dynamic>>> getTicketsByDepartment({
  required String baseUrl,
  required String token,
  required String departmentId,
}) async {
  final dio = Dio();
  final response = await dio.get(
    '$baseUrl/api/tickets/department',
    queryParameters: {'department_id': departmentId},
    options: Options(
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    ),
  );

  if (response.statusCode == 200 && response.data['success'] == true) {
    return List<Map<String, dynamic>>.from(response.data['data']);
  }
  throw Exception(response.data['message'] ?? 'Error al obtener tickets del departamento');
}
```
