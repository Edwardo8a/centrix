# CQRS en el Modulo de Autenticacion (Auth)

Este documento detalla como se aplica el patron CQRS especificamente en el modulo de autenticacion del backend.

---

## 1. Por que el Login se modela como un Command

Bajo la arquitectura CQRS, **el login es formalmente un Command**:

1. **Efecto de Estado:** No es una lectura pasiva; emite una credencial de seguridad nueva (token JWT) con marca de tiempo y fecha de expiracion, creando un estado de sesion activa.
2. **Accion de Seguridad Criptografica:** Interactua con Supabase Auth para verificar el hash de la contrasena. Si las credenciales fallan, lanza excepciones de negocio (401) e interrumpe el flujo.
3. **Mapeo de Dominio:** Conecta la identidad de Supabase con el perfil de la base de datos relacional de la empresa (`users`, `user_roles`, `roles`).

```text
POST /api/auth/login
       |
       v
[ src/commands/auth/LoginCommand.js ]  (COMMAND - Modifica estado de sesion)
       |-- Verifica contrasena con Supabase Auth
       |-- Obtiene perfil con UserRepository.findPersonaById()
       `-- Emite y firma el JWT con rol y vigencia
```

---

## 2. Verificacion de Tokens en Middlewares

Cuando el usuario ya cuenta con un token JWT y las peticiones protegidas necesitan validar su identidad, la operacion se ejecuta a traves de:

```text
Cualquier ruta protegida (Bearer Token)
       |
       v
[ src/middlewares/auth.js ]  (Lectura / Verificacion de claims)
       |-- Decodifica y verifica la firma del token con jwt.verify
       `-- Inyecta los claims decodificados en req.user
```
