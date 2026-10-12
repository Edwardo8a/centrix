# Flujo de Ejecucion HTTP: Modulo de Autenticacion (Auth)

Este documento describe la ruta exacta que recorre una peticion HTTP de inicio de sesion, desde que sale del cliente en Flutter hasta que se autentica y retorna el token JWT.

---

## 1. Diagrama de la Ruta HTTP

```text
1. FLUTTER (LoginScreen)
   Envia: POST /api/auth/login { email, password }
      |
      v
2. ENRUTADOR (src/routes/authRoutes.js)
   Recibe la ruta /login y aplica los middlewares:
      |-- loginValidator: Verifica email valido y password no vacio
      `-- validateResult: Si falla responde 400 Bad Request; si pasa continua
      |
      v
3. CONTROLADOR (src/controllers/AuthController.js)
   Desempaqueta req.body y construye el Command DTO:
   const command = new LoginCommand({ email, password });
   Invoca: loginHandler.handle(command)
      |
      v
4. HANDLER DE APLICACION (src/commands/auth/LoginHandler.js)
   Orquesta la autenticacion mediante servicios y modelos inyectados:
      |-- Paso 4A: authService.signIn(email, password)
      |            - Valida credenciales contra Supabase Auth.
      |            - Obtiene authId (UUID del usuario).
      |
      |-- Paso 4B: userReadModel.findById(authId)
      |            - Consulta la tabla users y su relacion de roles.
      |            - Si no existe el registro en BD, lanza BusinessError (404).
      |
      `-- Paso 4C: tokenService.generateToken(payload)
                   - Firma el JWT con id, email, role y roles.
      |
      v
5. RESPUESTA HTTP (src/utils/responseBuilder.js)
   Retorna HTTP 200 OK:
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
      v
6. FLUTTER (Recibe respuesta)
   Guarda el token en almacenamiento seguro (FlutterSecureStorage) y navega al HomeScreen.
```

---

## 2. Inyeccion de Dependencias en el Flujo

El `LoginHandler` no instancia clientes ni librerias externas directamente. Recibe todo inyectado por constructor a traves del contenedor:

```javascript
// src/config/container.js
const authService = new AuthService({ authClient, adminClient });
const userReadModel = new UserReadModel({ supabase: dataClient });
const tokenService = new TokenService({ jwtConfig });

const loginHandler = new LoginHandler({ authService, userReadModel, tokenService });

// src/controllers/AuthController.js
const { loginHandler } = require('../config/container');
```
