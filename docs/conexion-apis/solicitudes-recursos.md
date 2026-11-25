# Guia de Conexion: Solicitudes de Recursos (Resource Requests)

Esta guia describe como el equipo de Frontend (Flutter / Web) debe conectarse al modulo de solicitudes de recursos (material, equipo, software, servicios), implementado bajo la arquitectura **CQRS**.

---

## 1. Informacion de los Endpoints

| Metodo | Ruta | Operacion CQRS | Roles Autorizados | Descripcion |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/resource-requests` | Command | colaborador, gerente, administrador | Crear nueva solicitud de recursos |
| `GET` | `/api/resource-requests/mine` | Query | Todos los autenticados | Obtener mis solicitudes |
| `GET` | `/api/resource-requests/department/:departmentId` | Query | gerente, administrador | Solicitudes del departamento |
| `GET` | `/api/resource-requests/:id` | Query | colaborador (propietario), gerente, admin | Detalle completo de una solicitud |
| `DELETE` | `/api/resource-requests/:id` | Command | colaborador (propietario), administrador | Cancelar/eliminar solicitud (solo pendientes) |

---

## 2. Categorias y Estados Canonicos

### 2.1 Categorias (`category`)
- `equipamiento`: Computadoras, monitores, periféricos.
- `material`: Insumos de oficina, papelería, cables.
- `software`: Licencias, herramientas digitales.
- `servicio`: Mantenimiento, accesos, transporte.

### 2.2 Estados (`status`)
- `pendiente`: Solicitud creada en espera de revisión.
- `en_revision`: Evaluada por el gerente o compras.
- `aprobada`: Aprobada para adquisición/entrega.
- `rechazada`: Rechazada con motivo especificado.
- `entregada`: Recurso entregado al colaborador.

---

## 3. POST /api/resource-requests - Crear Solicitud

### 3.1 Cabeceras
```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT>
```

### 3.2 Cuerpo de la Peticion (Request Body)
```json
{
  "title": "Monitor adicional para diseno",
  "description": "Se requiere un segundo monitor 24 pulgadas para tareas de diseño UI",
  "category": "equipamiento",
  "priority": "Media",
  "quantity": 1,
  "estimated_cost": 3500.00,
  "department_id": "0dc6ef63-1234-5678-abcd-ef0123456789"
}
```

### 3.3 Respuesta Exitosa (201 Created)
```json
{
  "success": true,
  "message": "Solicitud de recurso creada exitosamente",
  "data": {
    "id": "c4b12345-6789-abcd-ef01-23456789abcd"
  }
}
```

---

## 4. GET /api/resource-requests/mine - Mis Solicitudes

### 4.1 Respuesta Exitosa (200 OK)
```json
{
  "success": true,
  "message": "Solicitudes obtenidas exitosamente",
  "data": [
    {
      "id": "c4b12345-6789-abcd-ef01-23456789abcd",
      "title": "Monitor adicional para diseno",
      "category": "equipamiento",
      "priority": "Media",
      "status": "pendiente",
      "quantity": 1,
      "estimated_cost": 3500.00,
      "created_at": "2026-11-12T10:00:00.000Z",
      "attachments": []
    }
  ]
}
```

---

## 5. Ejemplo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<String> createResourceRequest({
  required String baseUrl,
  required String token,
  required String title,
  required String description,
  required String category,
  required String priority,
  required int quantity,
  required String departmentId,
  double? estimatedCost,
}) async {
  final url = Uri.parse('$baseUrl/api/resource-requests');

  final response = await http.post(
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    },
    body: jsonEncode({
      'title': title,
      'description': description,
      'category': category,
      'priority': priority,
      'quantity': quantity,
      'department_id': departmentId,
      if (estimatedCost != null) 'estimated_cost': estimatedCost,
    }),
  );

  final body = jsonDecode(response.body);
  if (response.statusCode == 201 && body['success'] == true) {
    return body['data']['id'] as String;
  }
  throw Exception(body['message'] ?? 'Error al crear solicitud de recurso');
}
```
