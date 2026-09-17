# Documentación Técnica: Refactorización del flujo de autenticación

Este documento describe la refactorización del flujo de autenticación, separando correctamente las responsabilidades entre Backend y Flutter. 

### 🔐 Flujo completo de Login

```text
┌──────────────────────────────┐
│          FLUTTER             │
│                              │
│       LoginScreen            │
│            │                 │
│            ▼                 │
│      LoginViewModel          │
│            │                 │
│            ▼                 │
│       LoginRequest           │
│     email + password         │
└──────────────┬───────────────┘
               │ HTTP POST
               ▼
┌──────────────────────────────┐
│          BACKEND             │
│                              │
│        Controller            │
│            │                 │
│            ▼                 │
│       LoginCommand           │
│            │                 │
│            │ 1. Auth         │
│            ▼                 │
│      Supabase Auth           │
│   signInWithPassword()       │
│            │                 │
│            │ UUID            │
│            ▼                 │
│     UserRepository           │
│    findPersonaById(UUID)     │
│            │                 │
│            ▼                 │
│         personas             │
│            │                 │
│            ▼                 │
│      roles_personas          │
│            │                 │
│            ▼                 │
│           roles              │
│            │                 │
│            ▼                 │
│       Usuario + Rol          │
│            │                 │
│            ▼                 │
│       JWT personalizado      │
└──────────────┬───────────────┘
               │ JSON
               ▼
┌──────────────────────────────┐
│          FLUTTER             │
│                              │
│       LoginResponse          │
│            │                 │
│            ▼                 │
│        UserModel             │
│            │                 │
│            ▼                 │
│     Sesión autenticada       │
└──────────────────────────────┘
```

### 1. `LoginCommand.js`

El cambio importante fue dejar de hacer esto:

```text
Backend
   ↓
buscar usuario
   ↓
bcrypt.compare()
   ↓
validar contraseña
```

y pasar a:

```text
Backend
   ↓
Supabase Auth
   ↓
signInWithPassword()
   ↓
UUID del usuario
```

Esto significa que **el Backend ya no tiene que encargarse manualmente de comprobar la contraseña**.

El flujo queda:

```javascript
const { data, error } =
    await supabase.auth.signInWithPassword({
        email,
        password
    });
```

Si las credenciales son incorrectas:

```text
Supabase
   ↓
error
   ↓
401 Credenciales inválidas
   ↓
FIN
```

Si son correctas:

```text
Supabase
   ↓
data.user.id
   ↓
UUID
```

Ese UUID es entonces utilizado para localizar la información adicional del usuario.

---

### 2. `UserRepository.js`

Aquí hicimos otro cambio importante.

Antes teníamos una búsqueda genérica del usuario por correo.

Ahora tenemos:

```javascript
findPersonaById(id)
```

El razonamiento es:

```text
UUID obtenido de Supabase
          │
          ▼
       personas
          │
          ▼
   roles_personas
          │
          ▼
        roles
          │
          ▼
 descripción del rol
```

Por ejemplo:

```text
personas
┌──────────────┬────────────┬───────────────┐
│ id           │ nombre     │ apellido_pat  │
├──────────────┼────────────┼───────────────┤
│ UUID-123     │ Eduardo    │ Ochoa         │
└──────────────┴────────────┴───────────────┘
                    │
                    ▼
roles_personas
┌──────────────┬─────────────┐
│ persona_id   │ rol_id      │
├──────────────┼─────────────┤
│ UUID-123     │ 1           │
└──────────────┴─────────────┘
                    │
                    ▼
roles
┌────┬────────────────┐
│ id │ descripcion    │
├────┼────────────────┤
│ 1  │ administrador  │
└────┴────────────────┘
```

El repositorio hace el trabajo de convertir esa estructura en algo sencillo:

```javascript
{
    id: "...",
    nombre: "Eduardo",
    apellido_pat: "Ochoa",
    apellido_mat: "Almaraz",
    telefono: "...",
    role: "administrador"
}
```

Así `LoginCommand` **no necesita conocer la estructura interna de la BD**.

---

## 3. JWT personalizado

Después de obtener:

```text
Usuario
+
Correo
+
Rol
```

el `LoginCommand` genera nuestro JWT:

```javascript
const token = jwt.sign(
    {
        id: user.id,
        email: email,
        role: user.role
    },
    jwtConfig.secret
);
```

Por tanto, posteriormente una petición puede llevar:

```text
Authorization: Bearer <JWT>
```

y nuestro backend puede obtener:

```text
id
email
role
```

sin tener que volver a consultar la tabla de roles en cada petición que solamente necesite esa información.

---

# 📱 Parte Flutter

También dejamos más separada la responsabilidad.

### `login_request.dart`

Representa:

```text
Flutter
   ↓
LoginRequest
   ├── email
   └── password
```

Y:

```dart
toJson()
```

lo convierte en:

```json
{
  "email": "usuario@correo.com",
  "password": "********"
}
```

para enviarlo al backend.

---

### `login_response.dart`

Hace el proceso inverso:

```text
JSON del Backend
       ↓
LoginResponse.fromJson()
       ↓
┌─────────────────────┐
│ success             │
│ message             │
│ user                │
│ token               │
└─────────────────────┘
```

Y `user` se convierte en un:

```text
UserModel
```

Esto evita andar trabajando directamente con:

```dart
json['data']['user']['nombre']
```

por toda la aplicación.

---

# 🖥️ `login_screen.dart`

Aquí la pantalla **no debería encargarse de autenticar al usuario directamente**.

Su responsabilidad es principalmente:

```text
Capturar datos
     ↓
Avisar al ViewModel
     ↓
Mostrar estado
```

Por eso tenemos:

```text
LoginScreen
      │
      ▼
LoginViewModel
```

El `Consumer<LoginViewModel>` permite reaccionar a:

```text
isLoading
errorMessage
isSuccess
```

Por ejemplo:

```text
isLoading = true
      ↓
┌────────────────────────┐
│     Iniciando sesión   │
│                        │
│   CircularProgress     │
│                        │
│       [Deshabilitado]  │
└────────────────────────┘
```

Y si falla:

```text
isLoading = false
errorMessage = "Credenciales inválidas"
      ↓
mensaje rojo
```

---

# 🎨 `login_header.dart`

Este archivo quedó separado porque **no tiene lógica de autenticación**.

Su única responsabilidad es visual:

```text
LoginHeader
   │
   ├── HeaderPainter
   │     ├── curva
   │     ├── círculo
   │     ├── cuadrado
   │     └── triángulo
   │
   └── Logo
```

Esto es especialmente bueno porque si mañana cambiamos completamente el diseño del login, no tenemos que tocar:

* `LoginViewModel`
* `LoginRequest`
* `LoginResponse`
* API
* Supabase
* JWT

---

# 🧩 En resumen: qué conseguimos

La arquitectura ahora queda conceptualmente así:

```text
                 FLUTTER
┌────────────────────────────────────┐
│                                    │
│  VIEW                              │
│  LoginScreen                       │
│       │                            │
│       ▼                            │
│  VIEWMODEL                         │
│  LoginViewModel                    │
│       │                            │
│       ▼                            │
│  MODEL                             │
│  LoginRequest / LoginResponse      │
│                                    │
└────────────────┬───────────────────┘
                 │ HTTP
                 ▼
                 BACKEND
┌────────────────────────────────────┐
│                                    │
│  Controller                        │
│       │                            │
│       ▼                            │
│  Application                       │
│  LoginCommand                      │
│       │                            │
│       ├──────────────► Supabase    │
│       │                Auth        │
│       │                            │
│       ▼                            │
│  Infrastructure                    │
│  UserRepository                    │
│       │                            │
│       ▼                            │
│  Supabase Database                 │
│                                    │
│       │                            │
│       ▼                            │
│  JWT personalizado                 │
│                                    │
└────────────────────────────────────┘
```

**La idea central que conseguimos es:** Supabase se encarga de **autenticar la identidad**, el repositorio se encarga de **obtener los datos de negocio**, `LoginCommand` coordina el caso de uso y genera nuestro **JWT de aplicación**, mientras Flutter se ocupa de **presentar y manejar el estado de la interfaz**.
