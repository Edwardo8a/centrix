# Guia de Conexion: Registro de Usuarios (HU-11)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de creacion de usuarios en el modulo de Administracion.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `POST` |
| **Ruta** | `/api/admin/users` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `administrador` |
| **Tipo de Operacion CQRS** | Command (Alta en Auth y persistencia en base de datos) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_ADMINISTRADOR>
```

---

## 3. Cuerpo de la Peticion (Request Body)

```json
{
  "email": "nuevo.usuario@empresa.com",
  "password": "PasswordSeguro123!",
  "nombre": "Carlos",
  "apellido_pat": "Hernandez",
  "apellido_mat": "Lopez",
  "tel": "4271122334"
}
```

### Campos:
- **`email`** (String, Obligatorio): Correo electronico corporativo con formato valido.
- **`password`** (String, Obligatorio): Clave de acceso (minimo 8 caracteres).
- **`nombre`** (String, Obligatorio): Nombre de pila del usuario.
- **`apellido_pat`** (String, Obligatorio): Primer apellido.
- **`apellido_mat`** (String, Opcional): Segundo apellido.
- **`tel`** (String, Opcional): Numero de telefono de contacto.

---

## 4. Respuestas del Servidor

### 4.1. Respuesta Exitosa (201 Created)
```json
{
  "success": true,
  "message": "Usuario creado correctamente",
  "data": {
    "id": "e7b0e41f-13a8-49f2-8920-5c6ff6d93685"
  }
}
```

### 4.2. Respuestas de Error

#### 400 Bad Request (Validacion de campos)
```json
{
  "success": false,
  "message": "Datos de entrada no validos",
  "errors": [
    { "field": "password", "message": "El password debe tener al menos 8 caracteres" },
    { "field": "nombre", "message": "El nombre es obligatorio" }
  ]
}
```

#### 403 Forbidden (Permisos insuficientes)
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

Future<String?> createUser({
  required String baseUrl,
  required String adminToken,
  required String email,
  required String password,
  required String nombre,
  required String apellidoPat,
  String? apellidoMat,
  String? tel,
}) async {
  final url = Uri.parse('$baseUrl/api/admin/users');

  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $adminToken',
    },
    body: jsonEncode({
      'email': email,
      'password': password,
      'nombre': nombre,
      'apellido_pat': apellidoPat,
      'apellido_mat': apellidoMat,
      'tel': tel,
    }),
  );

  final body = jsonDecode(response.body);

  if (response.statusCode == 201 && body['success'] == true) {
    return body['data']['id'];
  } else {
    throw Exception(body['message'] ?? 'Error al crear usuario');
  }
}
```
