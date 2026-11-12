# Flujo de Ejecucion HTTP End-to-End: Consulta de Tickets por Departamento

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP al consultar las incidencias de un departamento, tanto desde la perspectiva del Frontend (Flutter) como en la arquitectura Backend (CQRS + SOLID).

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. INTERFAZ DE USUARIO (View)
   - El Gerente o Administrador navega a la pantalla de tickets por departamento.
   - La vista obtiene el department_id del usuario autenticado (guardado en sesion local).
   - Prepara la peticion GET con el query param:
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer <TOKEN_JWT_GERENTE_O_ADMIN>'
     }
   - Realiza la llamada HTTP:
     client.get(
       Uri.parse('$baseUrl/api/tickets/department?department_id=$departmentId'),
       headers: ...
     )
        |
        |  [HTTP GET /api/tickets/department?department_id=UUID]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. ENRUTADOR
   src/routes/ticketRoutes.js
   - Intercepta la ruta GET /department y ejecuta en serie:
     |-- authMiddleware:  Verifica la validez del token JWT
     |-- roleCheck([GERENTE, ADMINISTRADOR]): Control de acceso por rol
     |-- query('department_id').isUUID(): Valida que el query param sea UUID valido
     `-- validateResult: Si el UUID es invalido responde 400 Bad Request
        |
        v
3. CONTROLADOR
   src/controllers/TicketQueryController.js  (factory function)
   - Extrae departmentId de req.query.department_id
   - Invoca: getTicketsByDepartmentHandler.execute({ departmentId })
        |
        v
4. QUERY HANDLER (CQRS Read Side)
   src/queries/tickets/GetTicketsByDepartmentHandler.js
   - Recibe { departmentId }
   - Delega directamente al modelo de lectura:
     await this.ticketReadModel.getTicketsByDepartment(departmentId)
        |
        v
5. MODELO DE LECTURA (ReadModel)
   src/repositories/TicketReadModel.js
   - Ejecuta una consulta relacional optimizada con JOINs hacia la tabla users:
     supabase
       .from('tickets')
       .select(`
         id, title, description, priority, status,
         department_id, created_at, updated_at,
         created_by:users!created_by (id, full_name, email),
         assigned_to:users!assigned_to (id, full_name, email)
       `)
       .eq('department_id', departmentId)
       .is('deleted_at', null)
       .order('created_at', { ascending: false })
   - Resuelve de forma explicita la ambiguedad de relaciones en PostgreSQL.
        |
        v
6. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 200 OK con la proyeccion lista para la interfaz:
     {
       "success": true,
       "message": "Tickets del departamento obtenidos exitosamente",
       "data": [
         {
           "id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
           "title": "Falla en equipo de computo",
           "description": "El monitor no enciende",
           "priority": "Alta",
           "status": "Abierto",
           "department_id": "0dc6ef63-...",
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
        |
        |  [HTTP 200 OK Response]
        v
========================================================================================
                               FRONTEND (PROCESAMIENTO)
========================================================================================
7. RENDERIZADO EN FLUTTER
   - La aplicacion deserializa la lista JSON.
   - Construye la coleccion de tarjetas visuales (ListView / Cards) mostrando:
     * Titulo y prioridad (badge de color)
     * Nombre y correo de quien reporto (created_by.full_name)
     * Estado del ticket y fecha de registro
     * Nombre del agente asignado si existe (assigned_to?.full_name)
```

---

## 2. Archivos Involucrados

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| View (Flutter) | `lib/features/tickets/presentation/pages/department_tickets_page.dart` | Pantalla de tickets por departamento |
| ViewModel (Flutter) | `lib/features/tickets/presentation/viewmodels/department_tickets_viewmodel.dart` | Estado y llamada al repositorio |
| Repository (Flutter) | `lib/features/tickets/data/repositories/ticket_repository.dart` | Llamada HTTP con `dio` |
| Enrutador | `src/routes/ticketRoutes.js` | Define `GET /department` con middlewares |
| Controlador | `src/controllers/TicketQueryController.js` | Extrae query param y llama al handler |
| Query Handler | `src/queries/tickets/GetTicketsByDepartmentHandler.js` | Orquesta la consulta |
| ReadModel | `src/repositories/TicketReadModel.js` | Consulta SQL con JOINs |
| Response Builder | `src/utils/responseBuilder.js` | Formato estandar de respuesta |

---

## 3. Inyeccion de Dependencias en el Flujo Backend

El ensamblaje esta centralizado en `src/config/container.js`:

```javascript
// src/config/container.js
const getTicketsByDepartmentHandler = new GetTicketsByDepartmentHandler({ ticketReadModel });

const ticketQueryController = ticketQueryControllerFactory({
  getTicketsByDepartmentHandler,
  // ... otros handlers
});
```

---

## 4. Ejemplo Dart (Flutter)

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
  throw Exception(response.data['message'] ?? 'Error al obtener tickets');
}
```
