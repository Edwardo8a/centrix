# Principios SOLID en el Modulo de Autenticacion (Auth)

Este documento detalla como se aplican individualmente los cinco principios SOLID en el flujo de inicio de sesion (`POST /api/auth/login`).

---

## 1. S — Single Responsibility Principle (Responsabilidad Unica)

En el flujo de autenticacion, cada archivo tiene una funcion exclusiva:

- **`userValidator.js`:** Su unica tarea es validar que el `email` tenga estructura de correo electronico y que el `password` este presente. No consulta bases de datos ni emite tokens.
- **`AuthController.js`:** Su unica tarea es desempaquetar la peticion HTTP (`req.body`) y pasarla al comando de aplicacion.
- **`LoginCommand.js`:** Su unica tarea es orquestar la logica de negocio: pedir la verificacion de identidad a Supabase Auth, solicitar el perfil de la persona y firmar el JWT.
- **`UserRepository.js`:** Su unica tarea es ejecutar la consulta relacional contra las tablas `personas`, `roles_personas` y `roles`.
- **Supabase Auth:** Servicio externo dedicado a la criptografia y almacenamiento seguro de hashes de contrasenas.

---

## 2. O — Open/Closed Principle (Abierto / Cerrado)

El diseno permite anadir nuevas capacidades de autenticacion sin alterar las existentes:

- **Nuevos proveedores:** Si en el futuro se implementa autenticacion mediante Google OAuth o biometrica, se agrega un nuevo comando o adaptador sin tener que tocar la consulta de perfiles en `UserRepository` ni la configuracion de firmas de `jwt.js`.
- **Nuevos datos en sesion:** Si se requiere anadir el identificador de departamento o una lista de permisos adicionales dentro del token JWT, solo se amplian los claims en la firma sin alterar como se valida la contrasena.

---

## 3. L — Liskov Substitution Principle (Sustitucion de Liskov)

- Cuando un usuario ingresa una contrasena incorrecta, `LoginCommand` interrumpe el flujo arrojando una excepcion controlada:
  ```javascript
  throw new BusinessError('Credenciales invalidas', 401);
  ```
- Dado que `BusinessError` hereda directamente de la clase estandar `Error` de JavaScript, el middleware centralizado `errorHandler.js` lo procesa de manera polimorfica. El servidor no requiere condicionales especificos para saber como manejar errores de autenticacion; simplemente extrae el codigo `statusCode` y responde con el formato estandar de la API.

---

## 4. I — Interface Segregation Principle (Segregacion de Interfaces)

- `LoginCommand` solo necesita consultar a la persona y sus roles por su identificador unico. Por lo tanto, unicamente interactua con el metodo:
  ```javascript
  userRepository.findPersonaById(id);
  ```
- El comando de login no esta obligado a conocer ni depender de metodos administrativos del mismo repositorio, tales como `createUser()`, `assignRoles()` o eliminacion de usuarios.

---

## 5. D — Dependency Inversion Principle (Inversion de Dependencias)

`LoginCommand` no crea dependencias concretas dentro de su metodo `execute`. En su lugar, recibe el repositorio inyectado a traves del constructor:

```javascript
class LoginCommand {
  constructor(userRepository) {
    this.userRepository = userRepository; // Dependencia inyectada
  }

  async execute({ email, password }) {
    // Utiliza la interfaz sin importar si es la base de datos real o un mock
    const user = await this.userRepository.findPersonaById(data.user.id);
  }
}
```

### Beneficio en Pruebas Unitarias:
Gracias a la inversion de dependencias, es posible probar el login de forma completamente aislada en Jest inyectando un objeto simulado:

```javascript
const mockRepo = {
  findPersonaById: jest.fn().mockResolvedValue({ id: '123', role: 'admin' })
};
const command = new LoginCommand(mockRepo);
// Se prueba la logica en milisegundos sin conexion a internet ni tocar Supabase.
```
