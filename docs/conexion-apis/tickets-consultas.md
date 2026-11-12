# Guia de Conexion: Consultas de Tickets (Queries)

Esta guia describe los endpoints de lectura para consultar incidencias tecnicas en Centrix, adaptados para diferentes roles y pantallas del cliente Frontend (Flutter / Web).

---

## 1. Resumen de Endpoints de Consulta

| Metodo | Ruta | Descripcion | Roles Autorizados |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets` | Listado global con filtros y paginacion | `administrador` |
| `GET` | `/api/tickets/mine` | Incidencias creadas por el usuario autenticado | Todos los roles autenticados |
| `GET` | `/api/tickets/assigned` | Incidencias asignadas al tecnico autenticado | `soporte_tecnico`, `administrador` |
| `GET` | `/api/tickets/department` | Incidencias pertenecientes a un departamento | `gerente`, `administrador` |
| `GET` | `/api/tickets/:id` | Detalle completo de una incidencia (con historial y adjuntos) | Todos los roles autenticados |

---

## 2. Cabeceras Requeridas (Headers)

```http
Content-Type: application/json
Authorization: Bearer <TOKEN_JWT_DEL_USUARIO>
```

---

## 3. Detalle por Endpoint

### 3.1. Listado Global con Filtros y Paginacion (`GET /api/tickets`)
- **Acceso:** Solo `administrador`.
- **Query Parameters (Opcionales):**
  - `status` (String): Filtrar por estado (`Abierto`, `En revision`, `En progreso`, `Resuelto`, `Cerrado`, `Rechazado`).
  - `department_id` (UUID): Filtrar por departamento.
  - `priority` (String): Filtrar por prioridad (`Baja`, `Media`, `Alta`, `Critica`).
  - `page` (Int, default 1): Numero de pagina (>= 1).
  - `limit` (Int, default 10): Elementos por pagina (1 a 100).

**Ejemplo de Peticion:**
```http
GET /api/tickets?status=En%20progreso&page=1&limit=10
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tickets obtenidos exitosamente",
  "data": {
    "items": [
      {
        "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
        "title": "Falla en equipo de computo",
        "description": "La computadora se apago de forma repentina",
        "priority": "Alta",
        "status": "En progreso",
        "department_id": "0dc6ef63-a5df-4f92-804f-a097097ee005",
        "created_at": "2026-10-01T20:00:00.000Z",
        "updated_at": "2026-10-02T10:00:00.000Z",
        "created_by": {
          "id": "9942c9bf-0764-4724-a624-cc1f077d6b23",
          "full_name": "Eduardo Ochoa",
          "email": "eduardo@empresa.com"
        },
        "assigned_to": {
          "id": "a1b2c3d4-0000-4000-8000-000000000001",
          "full_name": "Tecnico Soporte",
          "email": "tecnico@empresa.com"
        }
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 3.2. Mis Tickets (`GET /api/tickets/mine`)
- **Acceso:** Cualquier usuario autenticado (típicamente `colaborador`).
- Devuelve las incidencias reportadas por el usuario que porta el JWT.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tickets del usuario obtenidos exitosamente",
  "data": [
    {
      "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
      "title": "Falla de red en piso 2",
      "status": "Abierto",
      "priority": "Media",
      "department_id": "0dc6ef63-a5df-4f92-804f-a097097ee005",
      "created_at": "2026-11-01T15:00:00.000Z"
    }
  ]
}
```

---

### 3.3. Tickets Asignados al Tecnico (`GET /api/tickets/assigned`)
- **Acceso:** `soporte_tecnico`, `administrador`.
- Si lo invoca un técnico, el backend extrae automáticamente su ID del token JWT.
- Si lo invoca un administrador, puede pasar opcionalmente `?assigned_to=<UUID>`.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tickets asignados obtenidos exitosamente",
  "data": [
    {
      "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
      "title": "Configuracion de impresora de red",
      "status": "En revision",
      "priority": "Alta",
      "created_by": { "full_name": "Ana Lopez", "email": "ana@empresa.com" }
    }
  ]
}
```

---

### 3.4. Tickets por Departamento (`GET /api/tickets/department`)
- **Acceso:** `gerente`, `administrador`.
- **Query Parameter (Obligatorio):** `department_id` (UUID).
- El backend protege contra acceso indebido (anti-IDOR): si el usuario es `gerente`, únicamente puede consultar el departamento al que está asignado.

**Ejemplo de Peticion:**
```http
GET /api/tickets/department?department_id=0dc6ef63-a5df-4f92-804f-a097097ee005
```

---

### 3.5. Detalle de Incidencia (`GET /api/tickets/:id`)
- **Acceso:** Todos los roles con permiso sobre el ticket.
- Devuelve la entidad completa, incluyendo el historial de auditoria de estados y los archivos adjuntos (evidencias).

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Detalle de ticket obtenido exitosamente",
  "data": {
    "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
    "title": "Falla en equipo de computo",
    "description": "El monitor parpadea y la maquina emite 3 pitidos al arrancar.",
    "priority": "Alta",
    "status": "En revision",
    "resolution_notes": null,
    "created_at": "2026-10-01T20:00:00.000Z",
    "updated_at": "2026-10-02T10:00:00.000Z",
    "created_by": {
      "id": "9942c9bf-0764-4724-a624-cc1f077d6b23",
      "full_name": "Eduardo Ochoa",
      "email": "eduardo@empresa.com"
    },
    "assigned_to": {
      "id": "a1b2c3d4-0000-4000-8000-000000000001",
      "full_name": "Carlos Soporte",
      "email": "carlos.soporte@empresa.com"
    },
    "attachments": [
      {
        "id": "att-123",
        "file_url": "https://supabase.../storage/v1/object/public/ticket-attachments/foto1.jpg",
        "file_name": "foto1.jpg",
        "file_type": "image/jpeg",
        "file_size": 204800,
        "created_at": "2026-10-01T20:05:00.000Z"
      }
    ],
    "history": [
      {
        "id": "hist-1",
        "previous_status": "Abierto",
        "new_status": "En revision",
        "comment": "Asignado a revision técnica",
        "changed_by": "Gerente Soporte",
        "created_at": "2026-10-02T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 4. Ejemplo de Consumo en Flutter (Dart)

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class TicketQueriesService {
  final String baseUrl;
  final String token;

  TicketQueriesService({required this.baseUrl, required this.token});

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // Obtener mis tickets
  Future<List<dynamic>> getMyTickets() async {
    final res = await http.get(Uri.parse('$baseUrl/api/tickets/mine'), headers: _headers);
    final json = jsonDecode(res.body);
    if (res.statusCode == 200 && json['success'] == true) {
      return json['data'];
    }
    throw Exception(json['message'] ?? 'Error al obtener tickets');
  }

  // Obtener detalle completo de un ticket
  Future<Map<String, dynamic>> getTicketDetail(String ticketId) async {
    final res = await http.get(Uri.parse('$baseUrl/api/tickets/$ticketId'), headers: _headers);
    final json = jsonDecode(res.body);
    if (res.statusCode == 200 && json['success'] == true) {
      return json['data'];
    }
    throw Exception(json['message'] ?? 'Ticket no encontrado');
  }
}
```
