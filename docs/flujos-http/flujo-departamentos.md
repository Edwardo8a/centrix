# Flujo de Ejecucion HTTP End-to-End: Catalogo de Departamentos (HU-13)

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP al consultar y poblar los departamentos tanto en las vistas de gestion como en los dropdowns de creacion y filtrado de tickets en Flutter.

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. VISTA Y VIEWMODEL (View / ViewModel)
   - Archivos:
     * `lib/features/departments/presentation/views/department_view.dart`
     * `lib/features/departments/presentation/view_models/department_view_model.dart`
     * `lib/features/tickets/presentation/views/create_ticket_view.dart` (poblado de dropdown)
   - El ViewModel invoca `fetchDepartments()` al inicializarse (`initState`):
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer <TOKEN_JWT>'
     }
   - Realiza la llamada HTTP:
     client.get(Uri.parse('$baseUrl/api/departments'), headers: ...)
        |
        |  [HTTP GET /api/departments]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. ENRUTADOR
   src/routes/departmentRoutes.js
   - Intercepta GET / y ejecuta:
     |-- authMiddleware: Verifica la validez del token JWT
     `-- router.get('/', departmentQueryController.getAllDepartments)
        |
        v
3. CONTROLADOR
   src/controllers/DepartmentQueryController.js
   - Invoca la query inyectada desde el contenedor:
     const departments = await this.getAllDepartmentsQuery.execute();
        |
        v
4. QUERY HANDLER (CQRS Read Side)
   src/queries/departments/GetAllDepartmentsQuery.js
   - Delega la consulta directamente en el modelo de lectura:
     return await this.departmentReadModel.getAll();
        |
        v
5. MODELO DE LECTURA (ReadModel)
   src/repositories/DepartmentReadModel.js
   - Ejecuta la lectura directa en Supabase PostgreSQL:
     const { data, error } = await this.supabase
       .from('departments')
       .select('id, name, description, created_at')
       .order('name', { ascending: true });
        |
        v
6. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 200 OK con el listado limpio:
     {
       "success": true,
       "message": "Departamentos obtenidos exitosamente",
       "data": [
         {
           "id": "0dc6ef63-1234-5678-abcd-ef0123456789",
           "name": "Sistemas",
           "description": "Area de soporte y tecnologia",
           "created_at": "2026-10-01T20:00:00.000Z"
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
   - `department_view_model.dart` parsea la lista y notifica a los listeners (`notifyListeners()`).
   - Escenario 1: En `department_view.dart` muestra la lista de departamentos de la organizacion.
   - Escenario 2: En `create_ticket_view.dart` puebla el `DropdownButtonFormField<String>`
     para que el colaborador elija a que departamento va dirigida su incidencia.
```

---

## 2. Archivos Involucrados

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| View (Flutter) | `lib/features/departments/presentation/views/department_view.dart` | Vista principal del listado |
| ViewModel (Flutter) | `lib/features/departments/presentation/view_models/department_view_model.dart` | Manejo de estado (`isLoading`, `departments`) |
| Enrutador | `src/routes/departmentRoutes.js` | Expone `GET /api/departments` con JWT auth |
| Controlador | `src/controllers/DepartmentQueryController.js` | Invoca `getAllDepartmentsQuery` |
| Query (CQRS) | `src/queries/departments/GetAllDepartmentsQuery.js` | Orquestador de lectura |
| ReadModel | `src/repositories/DepartmentReadModel.js` | Consulta optimizada a PostgreSQL Supabase |
