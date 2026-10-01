# Flujo de Ejecucion HTTP: Modulo de Autenticacion (Auth)

Este documento describe la ruta exacta que recorre una peticion HTTP de inicio de sesion, desde que sale de la interfaz de usuario en Flutter hasta que se autentica y retorna el token JWT.

---

## 1. Diagrama de la Ruta HTTP

```text
1. FLUTTER (LoginScreen)
   Envia: POST /api/auth/login { email, password }
      │
      ▼
2. ENRUTADOR (src/interfaces/routes/authRoutes.js)
   Recibe la ruta /login y aplica el validador
      │
      ▼
3. VALIDADOR (src/interfaces/validators/userValidator.js)
   Verifica: email valido y password no vacio
   • Si falla: 400 Bad Request
   • Si pasa : Continua al controlador
      │
      ▼
4. CONTROLADOR (src/interfaces/controllers/AuthController.js)
   Desempaqueta req.body y llama a loginCommand.execute({ email, password })
      │
      ▼
5. COMANDO DE APLICACION (src/application/commands/auth/LoginCommand.js)
   Orquesta la logica de autenticacion:
      ├── Paso 5A: Consulta a Supabase Auth (signInWithPassword)
      │            • Si contrasena incorrecta: Lanza BusinessError(401)
      │            • Si es correcta: Obtiene UUID de usuario
      │
      ├── Paso 5B: Llama a UserRepository.findPersonaById(UUID)
      │            • Consulta SQL: personas JOIN roles_personas JOIN roles
      │            • Extrae nombre, apellidos, telefono y rol
      │
      └── Paso 5C: Firma el JWT propio
                   jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '24h' })
      │
      ▼
6. FORMATEADOR DE RESPUESTA (src/utils/responseBuilder.js)
   AuthController recibe el objeto { user, token } y responde:
   HTTP 200 OK
      │
      ▼
7. FLUTTER (LoginViewModel / DashboardRouter)
   Guarda token en sesion y redirige segun el rol del usuario
```

---

## 2. Detalle Tecnico de Cada Paso

### Paso 1: Peticion Inicial en Flutter
La pantalla `LoginScreen` captura las credenciales del usuario y `AuthRepositoryImpl` emite una peticion `POST /api/auth/login` con encabezado `Content-Type: application/json`.

### Paso 2 y 3: Ruteo y Validacion de Entrada
En `authRoutes.js`, la peticion choca primero con el middleware `loginValidator` (definido con `express-validator` en `userValidator.js`). Si el usuario envia un correo sin formato o contrasena vacia, el validador detiene la peticion de inmediato y responde con codigo **400**, protegiendo al backend de llamadas inutiles.

### Paso 4: Desempaquetado en el Controlador
En `AuthController.js`, el metodo `login(req, res, next)` extrae `email` y `password` del `req.body`. El controlador no procesa datos ni consulta bases de datos; transfiere la carga directamente a `loginCommand.execute()`.

### Paso 5: Ejecucion del Comando de Negocio
`LoginCommand.js` es el nucleo del proceso:
1. **Verificacion Criptografica:** Llama a `supabase.auth.signInWithPassword`. Supabase se encarga de verificar el hash con salt de la contrasena. Si no coincide, se interrumpe el flujo arrojando `BusinessError('Credenciales invalidas', 401)`.
2. **Obtencion del Perfil Relacional:** Con el UUID validado, invoca `UserRepository.findPersonaById(uuid)`. Este repositorio une las tablas `personas`, `roles_personas` y `roles` y devuelve un objeto plano de usuario.
3. **Emision de Credenciales Propias:** Genera un token JWT firmado con `JWT_SECRET` que incluye el identificador, correo y rol del usuario. De esta forma, las peticiones futuras no requeriran consultar la base de datos para saber los permisos del usuario.

### Paso 6: Respuesta y Manejo de Errores
- **Camino Exitoso:** El controlador usa `ResponseBuilder.success` y entrega el JSON con codigo **200 OK**.
- **Camino de Error:** Si ocurre cualquier fallo, salta al middleware global `errorHandler.js`, que responde con el codigo HTTP adecuado (400, 401 o 500) sin crashear el servidor Node.js.
