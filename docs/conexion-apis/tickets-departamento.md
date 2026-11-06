# Guia de Conexion: Consulta de Tickets por Departamento

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de lectura de incidencias filtradas por departamento.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `GET` |
| **Ruta** | `/api/tickets/department/:departmentId` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `gerente`, `administrador` |
| **Tipo de Operacion CQRS** | Query (Lectura optimizada a traves de ReadModel) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Parametros de Ruta (Path Parameters)

- **`departmentId`** (UUID, Obligatorio): Identificador unico del departamento cuyas incidencias se desean listar.  
  Ejemplo: `/api/tickets/department/0dc6ef63-a5df-4f92-804f-a097097ee005`

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
      "description": "La computadora se apago de forma repentina y no vuelve a encender.",
      "priority": "Alta",
      "status": "Abierto",
      "department_id": "0dc6ef63-a5df-4f92-804f-a097097ee005",
      "created_at": "2026-10-01T20:00:00.000Z",
      "updated_at": "2026-10-01T20:00:00.000Z",
      "created_by": {
        "id": "9942c9bf-0764-4724-a624-cc1f077d6b23",
        "full_name": "Eduardo Ochoa Almaraz",
        "email": "usuario@correo.com"
      },
      "assigned_to": null
    }
  ]
}
```

### 4.2. Respuestas de Error

#### 400 Bad Request (UUID Invalido)
```json
{
  "success": false,
  "message": "Datos de entrada no validos",
  "errors": [
    { "field": "departmentId", "message": "El ID del departamento debe ser un UUID valido" }
  ]
}
```

#### 403 Forbidden (Rol no autorizado)
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta accion",
  "errors": null
}
```

---

## 5. Ejemplo de Consumo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<List<dynamic>> getTicketsByDepartment({
  required String baseUrl,
  required String token,
  required String departmentId,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets/department/$departmentId');

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
    throw Exception(body['message'] ?? 'Error al obtener tickets del departamento');
  }
}
```
