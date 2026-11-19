# Flujo de Ejecucion HTTP End-to-End: Registro de Usuarios (Admin HU-11)

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP al dar de alta un nuevo usuario en el sistema: desde el formulario en la aplicacion Flutter hasta la creacion de la cuenta en Supabase Auth y la insercion en la base de datos relacional.

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. VISTA DE ADMINISTRACION (View)
   lib/features/admin/users/view/admin_users_screen.dart
   - El administrador llena el formulario de registro:
     (email, password, nombre, apellido paterno, apellido materno, telefono)
   - Al presionar 'Guardar', invoca:
     adminUsersViewModel.createUser(...)
        |
        v
2. VIEWMODEL
   lib/features/admin/users/viewmodel/admin_users_viewmodel.dart
   - Valida campos obligatorios y formato de contrasena (minimo 8 caracteres)
   - Construye el DTO: CreateUserRequest(...)
   - Invoca: adminUserRepository.create(request)
        |
        v
3. REPOSITORIO HTTP (Data Source)
   lib/features/admin/users/data/http_admin_user_repository.dart
   - Prepara cabeceras con el JWT del administrador:
     headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer <ADMIN_JWT>'
     }
   - Mapea el body al formato esperado por el backend mediante request.toBackendJson():
     {
       "email": request.email,
       "password": request.password,
       "nombre": request.firstName,
       "apellido_pat": request.paternalLastName,
       "apellido_mat": request.maternalLastName,
       "tel": request.phone
     }
   - Ejecuta: client.post(Uri.parse('$baseUrl/api/admin/users'), ...)
        |
        |  [HTTP POST /api/admin/users]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
4. ENRUTADOR
   src/routes/adminRoutes.js
   - Aplica los filtros de seguridad en cascada:
     |-- authMiddleware: Valida firma y vigencia del JWT
     |-- roleCheck([UserRole.ADMINISTRADOR]): Rechaza con 403 Forbidden si no es admin
     |-- createUserValidator: Valida email, password >= 8 caracteres, nombre y apellido
     `-- validateResult: Si hay errores devuelve 400 Bad Request
        |
        v
5. CONTROLADOR
   src/controllers/AdminController.js
   - Extrae el body y construye el Command DTO:
     const command = new CreateUserCommand({ ...req.body });
   - Invoca: createUserHandler.handle(command)
        |
        v
6. HANDLER DE APLICACION (CQRS Write Side)
   src/commands/admin/CreateUserHandler.js
   - Orquesta la transaccion distribuida:
     |-- Paso 6A: authService.signUp(email, password)
     |            Crea el usuario en Supabase Auth y recupera el authId (UUID).
     |
     |-- Paso 6B: userRepository.create(userData, authId)
     |            Inserta el perfil en la tabla users y asigna el rol por defecto en user_roles.
     |
     `-- Rollback de compensacion:
         Si la insercion en BD falla, ejecuta authService.deleteUser(authId)
         para no dejar usuarios huerfanos en Supabase Auth.
        |
        v
7. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 201 Created:
     {
       "success": true,
       "message": "Usuario creado correctamente",
       "data": {
         "id": "e7b0e41f-13a8-49f2-8920-5c6ff6d93685"
       }
     }
        |
        |  [HTTP 201 Created Response]
        v
========================================================================================
                               FRONTEND (PROCESAMIENTO)
========================================================================================
8. RETORNO Y REFRESCO DE LISTA
   lib/features/admin/users/data/http_admin_user_repository.dart
   - Valida statusCode 201 y completa el Future sin errores.
   - admin_users_viewmodel.dart recibe confirmacion, muestra SnackBar exitoso
     y refresca la lista de usuarios invocando fetchAll().
```

---

## 2. Detalle de Archivos Involucrados

### Capa Frontend (Flutter MVVM)
| Archivo | Responsabilidad |
| :--- | :--- |
| `lib/features/admin/users/view/admin_users_screen.dart` | Formulario modal y lista de usuarios del sistema. |
| `lib/features/admin/users/viewmodel/admin_users_viewmodel.dart` | Gestiona el estado de carga y refresco de la coleccion de usuarios. |
| `lib/features/admin/users/domain/admin_user_repository.dart` | Contrato abstracto con metodos `fetchAll()` y `create()`. |
| `lib/features/admin/users/data/http_admin_user_repository.dart` | Implementacion HTTP con inyeccion de token JWT y mapeo JSON. |
| `lib/features/admin/users/domain/create_user_request.dart` | DTO que traduce nombres de variables de Dart a JSON (`toBackendJson()`). |

### Capa Backend (Node.js CQRS + SOLID)
| Archivo | Responsabilidad |
| :--- | :--- |
| `src/routes/adminRoutes.js` | Restriccion de rol admin y validadores de express-validator. |
| `src/controllers/AdminController.js` | Controlador HTTP; delega al `CreateUserHandler`. |
| `src/commands/admin/CreateUserCommand.js` | DTO inmutable de comando de escritura. |
| `src/commands/admin/CreateUserHandler.js` | Caso de uso que orquesta el alta y maneja el rollback de compensacion. |
| `src/services/AuthService.js` | Creacion (`signUp`) y borrado de emergencia (`deleteUser`) en Supabase Auth. |
| `src/repositories/UserRepository.js` | Insercion en las tablas `users` y `user_roles`. |
| `src/config/container.js` | Composition Root donde se ensamblan las dependencias del handler. |
