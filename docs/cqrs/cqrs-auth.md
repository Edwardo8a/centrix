# CQRS en el Modulo de Autenticacion (Auth)

Este documento detalla como se aplica el patron CQRS en el modulo de autenticacion del backend.

---

## 1. Por que el Login se modela como un Command

Bajo la arquitectura CQRS, **el login es formalmente un Command**:

1. **Efecto de Estado:** Emite una credencial de seguridad nueva (token JWT firmado) con marca de tiempo y vigencia determinada.
2. **Accion Criptografica:** Interactua con Supabase Auth mediante `AuthService.signIn` para verificar credenciales. Si fallan, arroja una excepcion de negocio interrumpiendo el flujo.
3. **Mapeo de Identidad:** Asocia el `authId` del proveedor con los datos relacionales en la base de datos usando `UserReadModel.findById`.

```text
POST /api/auth/login
       |
       v
[ src/commands/auth/LoginCommand.js ]  (DTO inmutable con { email, password })
       |
       v
[ src/commands/auth/LoginHandler.js ]  (HANDLER - Orquesta la autenticacion)
       |-- 1. authService.signIn(email, password)
       |-- 2. userReadModel.findById(authId)
       `-- 3. tokenService.generateToken(payload)
```

---

## 2. Segregacion de Responsabilidades en Auth

- **`LoginCommand.js`:** DTO puro que encapsula los datos recibidos desde el controlador.
- **`LoginHandler.js`:** Caso de uso que orquesta el login sin acoplarse a Supabase ni a JWT directamente.
- **`AuthService.js`:** Servicio que encapsula la comunicacion con Supabase Auth (`signIn`, `signUp`, `deleteUser`).
- **`UserReadModel.js`:** Modelo de lectura que consulta el perfil y roles del usuario sin metodos de mutacion.
- **`TokenService.js`:** Servicio que firma y parametriza el JWT.
- **`auth.js` (Middleware):** Middleware que intercepta peticiones protegidas y valida la firma del token en cada peticion.
