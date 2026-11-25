# Flujo de Ejecucion HTTP End-to-End: Solicitudes de Recursos

Este documento describe la ruta completa que recorre la peticion HTTP al crear, listar y consultar solicitudes de recursos entre Frontend (Flutter) y Backend (CQRS + Supabase).

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. INTERFAZ DE USUARIO (View)
   - El colaborador llena el formulario de peticion de recursos:
     * Titulo (ej: Monitor 24 pulgadas)
     * Descripcion detallada
     * Categoria (equipamiento, material, software, servicio)
     * Prioridad (Baja, Media, Alta, Critica)
     * Cantidad y costo estimado
     * Departamento al que pertenece
   - Prepara y envia la peticion:
     POST /api/resource-requests
     headers: { 'Authorization': 'Bearer <TOKEN_JWT>', 'Content-Type': 'application/json' }
        |
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. ENRUTADOR Y VALIDACION
   src/routes/resourceRequestRoutes.js
   - Verifica autenticacion JWT (`authMiddleware`).
   - Valida el payload con `createResourceRequestValidator`:
     * `category` debe ser valida segun `ResourceRequestCategory`.
     * `quantity` entero mayor o igual a 1.
     * `department_id` UUID valido.
        |
        v
3. CONTROLADOR
   src/controllers/ResourceRequestCommandController.js
   - Crea `CreateResourceRequestCommand` asociando `user_id: req.user.id`.
   - Llama a `createResourceRequestHandler.handle(command)`.
        |
        v
4. HANDLER DE APLICACION (CQRS Write Side)
   src/commands/resource-requests/CreateResourceRequestHandler.js
   - Instancia el modelo de dominio `ResourceRequest`.
   - Delega la persistencia a `ResourceRequestRepository.create()`.
        |
        v
5. PERSISTENCIA
   src/repositories/ResourceRequestRepository.js
   - Inserta en la tabla `resource_requests` en Supabase PostgreSQL.
   - Retorna el ID asignado con estado inicial `pendiente`.
        |
        v
6. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 201 Created:
     {
       "success": true,
       "message": "Solicitud de recurso creada exitosamente",
       "data": { "id": "uuid-generado" }
     }
        |
        v
========================================================================================
                               FRONTEND (PROCESAMIENTO)
========================================================================================
7. ACTUALIZACION EN FLUTTER
   - Notifica exito con SnackBar.
   - Refresca el listado de mis solicitudes (`GET /api/resource-requests/mine`).
```

---

## 2. Archivos Involucrados

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| Enrutador | `src/routes/resourceRequestRoutes.js` | Define rutas de recursos y validaciones |
| Validador | `src/validators/resourceRequestValidator.js` | Comprueba categorias, campos y formatos |
| Controlador Escritura | `src/controllers/ResourceRequestCommandController.js` | Factory pattern para Commands |
| Controlador Lectura | `src/controllers/ResourceRequestQueryController.js` | Factory pattern para Queries |
| Command | `src/commands/resource-requests/CreateResourceRequestCommand.js` | DTO inmutable de entrada |
| Handler Escritura | `src/commands/resource-requests/CreateResourceRequestHandler.js` | Orquestador de creación |
| Repositorio | `src/repositories/ResourceRequestRepository.js` | Mutaciones en BD Supabase |
| ReadModel | `src/repositories/ResourceRequestReadModel.js` | Consultas relacionales con JOINs |
