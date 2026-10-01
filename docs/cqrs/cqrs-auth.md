# CQRS en el Modulo de Autenticacion (Auth)

Este documento detalla como se aplica el patron CQRS especificamente en el modulo de autenticacion del backend.

---

## 1. Por que el Login se modela como un Command

A primera vista podria parecer que iniciar sesion es una consulta (porque se busca al usuario por correo). Sin embargo, bajo la arquitectura CQRS, **el login es formalmente un Command**:

1. **Efecto de Estado:** No es una lectura pasiva; emite una credencial de seguridad nueva (token JWT) con marca de tiempo y fecha de expiracion, creando un estado de sesion activa.
2. **Accion de Seguridad Criptografica:** Interactua con Supabase Auth para verificar el hash de la contrasena. Si las credenciales fallan, lanza excepciones de negocio (401) e interrumpe el flujo.
3. **Mapeo de Dominio:** Conecta la identidad de Supabase con el perfil de la base de datos relacional de la empresa (`personas`, `roles`).

```text
POST /api/auth/login
       │
       ▼
[ LoginCommand.js ]  (COMMAND - Modifica estado de sesion)
       ├── Verifica contraseña con Supabase Auth
       ├── Obtiene perfil con UserRepository.findPersonaById()
       └── Emite y firma el JWT con rol y vigencia
```

---

## 2. La Contraparte: ValidateToken como Query

Cuando el usuario ya cuenta con un token JWT y la aplicacion solo necesita verificar si la sesion sigue siendo valida, la operacion se ejecuta a traves de una **Query**:

```text
GET /api/auth/validate-token (o via authMiddleware)
       │
       ▼
[ ValidateTokenQuery.js / ValidateTokenUseCase.js ]  (QUERY - Solo lectura)
       ├── Decodifica el token sin alterar el sistema
       └── Retorna si es valido y los claims del usuario
```

### Diferencia Clave:
- `LoginCommand`: Requiere credenciales confidenciales (password), produce un token nuevo y puede fallar por reglas de negocio.
- `ValidateTokenQuery`: No recibe contrasenas, no altera nada en la base de datos y solo valida la firma digital del token existente.
