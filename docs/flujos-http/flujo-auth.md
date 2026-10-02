# Flujo de Ejecucion HTTP: Modulo de Autenticacion (Auth)

Este documento describe la ruta exacta que recorre una peticion HTTP de inicio de sesion, desde que sale de la interfaz de usuario en Flutter hasta que se autentica y retorna el token JWT.

---

## 1. Diagrama de la Ruta HTTP

```text
1. FLUTTER (LoginScreen)
   Envia: POST /api/auth/login { email, password }
      |
      v
2. ENRUTADOR (src/routes/authRoutes.js)
   Recibe la ruta /login y aplica el validador
      |
      v
3. VALIDADOR (src/validators/userValidator.js)
   Verifica: email valido y password no vacio
   - Si falla: 400 Bad Request
   - Si pasa : Continua al controlador
      |
      v
4. CONTROLADOR (src/controllers/AuthController.js)
   Desempaqueta req.body y llama a loginCommand.execute({ email, password })
      |
      v
5. COMANDO CQRS (src/commands/auth/LoginCommand.js)
   Orquesta la logica de autenticacion:
      |-- Paso 5A: Consulta a Supabase Auth (signInWithPassword)
      |            - Si contrasena incorrecta: Lanza BusinessError(401)
      |            - Si es correcta: Obtiene UUID de usuario
      |
      |-- Paso 5B: Llama a UserRepository.findPersonaById(UUID)
      |            - Consulta: users JOIN user_roles JOIN roles
      |            - Extrae nombre, apellidos, telefono y roles
      |
      `-- Paso 5C: Firma el JWT propio
                   jwt.sign({ id, email, role, roles }, JWT_SECRET, { expiresIn: '24h' })
      |
      v
6. RESPUESTA (src/utils/responseBuilder.js)
   Empaqueta la respuesta estandar:
   {
     "success": true,
     "message": "Inicio de sesion exitoso",
     "data": { "user": { ... }, "token": "..." }
   }
      |
      v
7. FLUTTER (Recibe respuesta)
   Guarda token en almacenamiento seguro y navega al HomeScreen
```

---

## 2. Desglose Tecnico por Archivo

### Paso 1: Interfaz de Usuario (Frontend)
- **Archivo:** `login_view.dart`
- **Accion:** Captura correo y contrasena en un formulario, valida formato local y envia la peticion HTTP usando `http.post` o `dio`.

### Paso 2: Enrutamiento
- **Archivo:** `src/routes/authRoutes.js`
- **Accion:** Conecta la ruta `/api/auth/login` con el validador `loginValidator` y el controlador `AuthController.login`.

### Paso 3: Validacion de Entrada
- **Archivo:** `src/validators/userValidator.js`
- **Reglas:**
  - `email`: Formato de correo electronico valido.
  - `password`: No vacio.
- **Manejador de error:** `src/utils/validatorHelpers.js` si hay errores, interrumpe antes de llegar al controlador.

### Paso 4: Controlador
- **Archivo:** `src/controllers/AuthController.js`
- **Metodo:** `login(req, res, next)`
- **Accion:** Extrae `{ email, password }` de `req.body`, invoca `loginCommand.execute(...)` y maneja errores con `next(error)`.

### Paso 5: Comando de Escritura CQRS
- **Archivo:** `src/commands/auth/LoginCommand.js`
- **Regla:** Emite y firma el JWT; no expone la contrasena en ningun momento del flujo.
