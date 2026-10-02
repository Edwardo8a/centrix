# Guia de Conexion: Autenticacion (Login)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de inicio de sesion para autenticar usuarios y obtener el token JWT de sesion.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `POST` |
| **Ruta** | `/api/auth/login` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Publica (No requiere token previo) |
| **Tipo de Operacion CQRS** | Command (Crea estado de sesion) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
```

---

## 3. Cuerpo de la Peticion (Request Body)

```json
{
  "email": "usuario@correo.com",
  "password": "miPasswordSeguro123"
}
```

### Validaciones:
- `email`: Cadena de texto obligatoria, con formato de correo valido.
- `password`: Cadena de texto obligatoria, no vacia.

---

## 4. Respuestas del Servidor

### 4.1. Respuesta Exitosa (200 OK)

Devuelve el token JWT y el perfil de la persona con su rol asignado:

```json
{
  "success": true,
  "message": "Inicio de sesion exitoso",
  "data": {
    "user": {
      "id": "9942c9bf-0764-4724-a624-cc1f077d6b23",
      "email": "usuario@correo.com",
      "fullName": "Eduardo Ochoa Almaraz",
      "role": "administrador",
      "tel": "4271234567"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk5NDJjOWJmLTA3NjQtNDcyNC1hNjI0LWNjMWYwNzdkNmIyMyIsImVtYWlsIjoidXN1YXJpb0Bjb3JyZW8uY29tIiwicm9sZSI6ImFkbWluaXN0cmFkb3IiLCJpYXQiOjE3ODkwNTE3NzEsImV4cCI6MTc4OTEzODE3MX0.abcdef..."
  }
}
```

### 4.2. Respuestas de Error

#### 400 Bad Request (Datos incompletos o mal formados)
```json
{
  "success": false,
  "message": "Datos de entrada no validos",
  "errors": [
    { "field": "email", "message": "Debe proporcionar un correo valido" }
  ]
}
```

#### 401 Unauthorized (Credenciales invalidas)
```json
{
  "success": false,
  "message": "Credenciales invalidas",
  "errors": null
}
```

---

## 5. Ejemplo de Consumo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>?> login({
  required String baseUrl,
  required String email,
  required String password,
}) async {
  final url = Uri.parse('$baseUrl/api/auth/login');

  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );

  final body = jsonDecode(response.body);

  if (response.statusCode == 200 && body['success'] == true) {
    final token = body['data']['token'];
    final user = body['data']['user'];
    print('Sesion iniciada para: ${user['fullName']} con rol: ${user['role']}');
    return body['data'];
  } else {
    print('Fallo al iniciar sesion: ${body['message']}');
    return null;
  }
}
```
