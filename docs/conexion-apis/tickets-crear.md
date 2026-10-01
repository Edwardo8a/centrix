# Guia de Conexion: Creacion de Tickets Basicos (HU-03 / PPS-12 / PPS-86)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al endpoint de creacion de nuevas incidencias tecnicas.

---

## 1. Informacion del Endpoint

| Parametro | Detalle |
| :--- | :--- |
| **Metodo HTTP** | `POST` |
| **Ruta** | `/api/tickets` |
| **URL Base Local** | `http://localhost:3001` (o `http://10.0.2.2:3001` en emulador Android) |
| **Autenticacion** | Requerida (`Bearer Token`) |
| **Roles Autorizados** | `colaborador`, `gerente`, `administrador` |
| **Tipo de Operacion CQRS** | Command (Mutacion con transaccion ACID) |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Cuerpo de la Peticion (Request Body)

```json
{
  "title": "Falla en equipo de computo",
  "description": "La computadora se apago de forma repentina y no vuelve a encender.",
  "priority": "Alta",
  "department_id": "0dc6ef63-a5df-4f92-804f-a097097ee005"
}
```

### Campos:
- **`title`** (String, Obligatorio): Titulo o asunto de la incidencia.
- **`description`** (String, Obligatorio): Detalle del problema reportado.
- **`priority`** (String, Obligatorio): Nivel de prioridad (`Baja`, `Media`, `Alta`, `Critica`).
- **`department_id`** (UUID, Obligatorio): Identificador del departamento al que se canaliza el ticket (obtenido desde `GET /api/departments`).

*Nota:* El creador del ticket no se envia en el body; el backend extrae automaticamente el `id` del usuario desde el token JWT.

---

## 4. Respuestas del Servidor

### 4.1. Respuesta Exitosa (201 Created)
```json
{
  "success": true,
  "message": "Ticket creado exitosamente (ACID Command)",
  "data": {
    "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
    "title": "Falla en equipo de computo",
    "description": "La computadora se apago de forma repentina",
    "priority": "Alta",
    "status": "Abierto",
    "created_by": "9942c9bf-0764-4724-a624-cc1f077d6b23",
    "department_id": "0dc6ef63-a5df-4f92-804f-a097097ee005",
    "created_at": "2026-10-01T20:00:00.000Z"
  }
}
```

---

## 5. Ejemplo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>?> createTicket({
  required String baseUrl,
  required String token,
  required String title,
  required String description,
  required String priority,
  required String departmentId,
}) async {
  final url = Uri.parse('$baseUrl/api/tickets');

  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'title': title,
      'description': description,
      'priority': priority,
      'department_id': departmentId,
    }),
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 201 && body['success'] == true) {
    return body['data'];
  } else {
    throw Exception(body['message'] ?? 'Error al crear ticket');
  }
}
```
