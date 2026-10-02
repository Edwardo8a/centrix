# Guia de Conexion: Asignacion y Cambio de Roles (PPS-42 / HU-11 / HU-12)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de asignacion y reemplazo de roles de usuarios en el modulo de Administracion.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `PUT` |
| **Ruta** | `/api/admin/users/:userId/roles` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `administrador` |
| **Tipo de Operacion CQRS** | Command (Mutacion de permisos) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_ADMINISTRADOR>
```

---

## 3. Parametros de Ruta (Path Parameters)

- `:userId` (UUID, Obligatorio): Identificador de la persona a quien se le actualizaran los roles.  
  Ejemplo: `/api/admin/users/9942c9bf-0764-4724-a624-cc1f077d6b23/roles`

---

## 4. Cuerpo de la Peticion (Request Body)

```json
{
  "roles": [1, 2]
}
```

### Campos:
- **`roles`** (Array de BigInt, Obligatorio): Lista de identificadores de rol a asignar.
  - Para asignar un solo rol: `"roles": [2]` (por ejemplo: Gerente).
  - Para asignar multiples roles: `"roles": [1, 2]` (por ejemplo: Administrador y Soporte Tecnico).
  - El backend elimina de forma transaccional los roles previos en `roles_personas` e inserta el nuevo listado.

---

## 5. Respuestas del Servidor

### 5.1. Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Roles del usuario actualizados correctamente",
  "data": {
    "id": "9942c9bf-0764-4724-a624-cc1f077d6b23",
    "roles": [1, 2]
  }
}
```

### 5.2. Errores Frecuentes
- **400 Bad Request:** Si el campo `roles` no es un arreglo o se envia vacio `[]`.
- **403 Forbidden:** Si el usuario que llama al endpoint no tiene rol de `administrador`.

---

## 6. Ejemplo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<bool> updateUserRoles({
  required String baseUrl,
  required String adminToken,
  required String userId,
  required List<int> roleIds,
}) async {
  final url = Uri.parse('$baseUrl/api/admin/users/$userId/roles');

  final response = await http.put(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $adminToken',
    },
    body: jsonEncode({
      'roles': roleIds,
    }),
  );

  final body = jsonDecode(response.body);
  return response.statusCode == 200 && body['success'] == true;
}
```
