# Guia de Conexion: Consulta de Agentes de Soporte por Departamento

Esta guia describe como el equipo de Frontend (Flutter) debe conectarse al endpoint para obtener la lista de usuarios con rol `soporte_tecnico` disponibles en un departamento. Se utiliza principalmente para poblar el dropdown de asignacion de tickets.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `GET` |
| **Ruta** | `/api/users/solvers` |
| **Query Param** | `?department_id=UUID` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `gerente`, `administrador` |
| **Tipo de Operacion CQRS** | Query (Lectura desde `UserReadModel`) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Query Parameters

| Parametro | Tipo | Obligatorio | Descripcion |
| :--- | :--- | :--- | :--- |
| `department_id` | UUID | Si | ID del departamento a consultar |

**Ejemplo de URL completa:**
```
GET http://localhost:3001/api/users/solvers?department_id=0dc6ef63-1234-5678-abcd-ef0123456789
```

---

## 4. Respuestas del Servidor

### 4.1. Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Agentes de soporte obtenidos exitosamente",
  "data": [
    {
      "id": "solver-uuid-1",
      "full_name": "Carlos Ramirez",
      "email": "carlos@centrix.com"
    },
    {
      "id": "solver-uuid-2",
      "full_name": "Ana Lopez",
      "email": "ana@centrix.com"
    }
  ]
}
```

### 4.2. Lista Vacia (200 OK)

Si no hay agentes en el departamento, retorna un arreglo vacio:

```json
{
  "success": true,
  "message": "Agentes de soporte obtenidos exitosamente",
  "data": []
}
```

### 4.3. Errores Comunes

| Codigo | Mensaje | Causa |
| :--- | :--- | :--- |
| `400` | `department_id debe ser un UUID valido` | Query param invalido |
| `401` | `Token no proporcionado` / `Token no valido o expirado` | JWT ausente o caducado |
| `403` | `No tienes permisos para realizar esta accion` | Rol no autorizado |

---

## 5. Handler y ReadModel (CQRS)

```text
GET /api/users/solvers?department_id=UUID
  --> GetDepartmentSolversQuery { departmentId }
  --> GetDepartmentSolversHandler.execute(query)
      --> UserReadModel.getSolversByDepartment(departmentId)
          --> SELECT id, full_name, email FROM users
              JOIN user_roles ON users.id = user_roles.user_id
              WHERE user_roles.role = 'soporte_tecnico'
              AND users.department_id = departmentId
  --> 200 OK [ { id, full_name, email }, ... ]
```

---

## 6. Uso Tipico en el Flujo de Asignacion

```text
1. Gerente abre pantalla de detalle de ticket
2. Presiona boton "Asignar"
3. Flutter llama GET /api/users/solvers?department_id=<ticket.department_id>
4. Se puebla el dropdown con los agentes disponibles
5. Gerente selecciona un agente y confirma
6. Flutter llama PATCH /api/tickets/:id/assign  { assignee_id: solver.id }
```

Ver [tickets-asignar.md](./tickets-asignar.md) para el flujo completo de asignacion.

---

## 7. Ejemplo en Flutter (Dart)

```dart
import 'package:dio/dio.dart';

Future<List<Map<String, dynamic>>> getDepartmentSolvers({
  required String baseUrl,
  required String token,
  required String departmentId,
}) async {
  final dio = Dio();
  final response = await dio.get(
    '$baseUrl/api/users/solvers',
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
  throw Exception(response.data['message'] ?? 'Error al obtener agentes de soporte');
}
```
