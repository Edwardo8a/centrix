# Flujo de Ejecucion HTTP End-to-End: Modulo de Autenticacion (Login)

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP de inicio de sesion: desde la captura en la aplicacion movil en Flutter (Frontend con patron MVVM) hasta la verificacion de credenciales en la base de datos (Backend con patron CQRS y SOLID) y el posterior enrutamiento por roles en la interfaz.

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. VISTA (View)
   lib/features/auth/view/login_screen.dart
   - Captura email y password en los TextFormField
   - Valida que no esten vacios y dispara:
     context.read<LoginViewModel>().login(email, password)
        |
        v
2. VIEWMODEL
   lib/features/auth/viewmodel/login_viewmodel.dart
   - Establece isLoading = true y notifica a la UI (muestra Spinner)
   - Construye el DTO: LoginRequest(email: email, password: password)
   - Invoca: _authRepository.login(request)
        |
        v
3. REPOSITORIO HTTP (Data Source)
   lib/features/auth/data/auth_repository_impl.dart
   - Resuelve la URL: http://<HOST>:3001/api/auth/login
   - Ejecuta la llamada de red:
     client.post(
       Uri.parse('$baseUrl/login'),
       headers: {'Content-Type': 'application/json'},
       body: jsonEncode(request.toJson()),
     )
        |
        |  [HTTP POST /api/auth/login]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
4. ENRUTADOR
   src/routes/authRoutes.js
   - Intercepta la ruta POST /login y aplica los middlewares en cadena:
     |-- loginValidator: Verifica formato email y password no vacio
     `-- validateResult: Si hay error retorna 400 Bad Request; si es valido continua
        |
        v
5. CONTROLADOR
   src/controllers/AuthController.js
   - Desempaqueta { email, password } de req.body
   - Crea el Command DTO: const command = new LoginCommand({ email, password })
   - Invoca: loginHandler.handle(command)
        |
        v
6. HANDLER DE APLICACION (CQRS Write Side)
   src/commands/auth/LoginHandler.js
   - Orquesta la autenticacion mediante dependencias inyectadas (DIP):
     |-- Paso 6A: authService.signIn(email, password) -> Valida hash en Supabase Auth
     |-- Paso 6B: userReadModel.findById(authId) -> Consulta tabla users y roles
     `-- Paso 6C: tokenService.generateToken(payload) -> Firma el JWT propio (24h)
        |
        v
7. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Serializa y retorna HTTP 200 OK:
     {
       "success": true,
       "message": "Inicio de sesion exitoso",
       "data": {
         "user": {
           "id": "9942c9bf-...",
           "email": "usuario@correo.com",
           "fullName": "Eduardo Ochoa Almaraz",
           "role": "administrador",
           "roles": ["administrador"],
           "tel": "4271234567"
         },
         "token": "eyJhbGciOi..."
       }
     }
        |
        |  [HTTP 200 OK Response]
        v
========================================================================================
                               FRONTEND (PROCESAMIENTO)
========================================================================================
8. RETORNO AL REPOSITORIO FLUTTER
   lib/features/auth/data/auth_repository_impl.dart
   - Parsea el JSON a LoginResponse.fromJson(body)
   - Retorna la entidad al ViewModel
        |
        v
9. ACTUALIZACION DE ESTADO EN VIEWMODEL
   lib/features/auth/viewmodel/login_viewmodel.dart
   - Guarda _authenticatedUser y _token
   - Establece _isLoading = false e _isSuccess = true
   - Ejecuta notifyListeners()
        |
        v
10. NAVEGACION POR ROL (ROUTER)
    lib/features/dashboard/view/dashboard_router.dart
    - Evalua UserRole.fromBackend(user.role) y redirige a la vista correspondiente:
      |-- UserRole.administrador -> AdminDashboardScreen
      |-- UserRole.gerente       -> ManagerDashboardScreen
      `-- UserRole.colaborador   -> CollaboratorDashboardScreen
```

---

## 2. Detalle de Archivos Involucrados

### Capa Frontend (Flutter MVVM)
| Archivo | Responsabilidad |
| :--- | :--- |
| `lib/features/auth/view/login_screen.dart` | Formulario visual con validacion de campos y disparador del evento de login. |
| `lib/features/auth/viewmodel/login_viewmodel.dart` | Manejo reactivo de estados (`isLoading`, `errorMessage`, `isSuccess`) y retencion de credenciales en memoria. |
| `lib/features/auth/data/auth_repository.dart` | Contrato abstracto del repositorio de autenticacion. |
| `lib/features/auth/data/auth_repository_impl.dart` | Implementacion con cliente `http` hacia la API REST (`POST /api/auth/login`). |
| `lib/features/auth/data/models/login_request.dart` | DTO con `{ email, password }` serializable a JSON. |
| `lib/features/auth/data/models/login_response.dart` | DTO que deserializa la respuesta `{ success, message, data }`. |
| `lib/features/auth/data/models/user_model.dart` | Modelo del usuario autenticado (`id`, `email`, `fullName`, `role`). |
| `lib/features/dashboard/view/dashboard_router.dart` | Enrutador declarativo por rol (`administrador`, `gerente`, `colaborador`). |

### Capa Backend (Node.js CQRS + SOLID)
| Archivo | Responsabilidad |
| :--- | :--- |
| `src/routes/authRoutes.js` | Enrutamiento Express y validaciones con `userValidator`. |
| `src/controllers/AuthController.js` | Controlador HTTP delgado; delega al `LoginHandler`. |
| `src/commands/auth/LoginCommand.js` | DTO inmutable de comando de escritura. |
| `src/commands/auth/LoginHandler.js` | Caso de uso que orquesta `AuthService`, `UserReadModel` y `TokenService`. |
| `src/services/AuthService.js` | Comunicacion con Supabase Auth. |
| `src/repositories/UserReadModel.js` | Consulta relacional de usuario y roles en PostgreSQL. |
| `src/services/TokenService.js` | Generacion y firma de tokens JWT. |
| `src/config/container.js` | Composition Root donde se inyectan las dependencias. |
