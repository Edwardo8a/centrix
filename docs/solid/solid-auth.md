# Principios SOLID en el Modulo de Autenticacion (Auth)

Este documento detalla como se aplican individualmente los cinco principios SOLID en el flujo de inicio de sesion (`POST /api/auth/login`).

---

## 1. S - Single Responsibility Principle (Responsabilidad Unica)

En el flujo de autenticacion, cada archivo tiene una funcion exclusiva y aislada:

- **`userValidator.js`:** Valida que el email tenga formato valido y que el password este presente.
- **`AuthController.js`:** Extrae `req.body`, instancia `LoginCommand` y delega a `loginHandler.handle()`.
- **`LoginCommand.js`:** DTO inmutable que unicamente transporta las credenciales.
- **`LoginHandler.js`:** Orquesta el caso de uso coordinando tres colaboradores inyectados: `authService`, `userReadModel` y `tokenService`.
- **`AuthService.js`:** Encapsula la comunicacion y autenticacion con Supabase Auth.
- **`UserReadModel.js`:** Ejecuta la consulta de lectura para obtener el perfil y roles del usuario en la base de datos.
- **`TokenService.js`:** Encapsula la firma y expiracion del token JWT con `jsonwebtoken`.

---

## 2. O - Open/Closed Principle (Abierto / Cerrado)

- **Soporte de nuevos proveedores:** Si manana se agrega autenticacion con Google OAuth, se puede crear un `OAuthLoginCommand` y `OAuthLoginHandler`, o implementar un nuevo proveedor en `AuthService` sin modificar `UserReadModel` ni `TokenService`.
- **Modificacion de la sesion:** Si cambian los datos incluidos en el token JWT, solo se modifica `TokenService` sin tocar la orquestacion en `LoginHandler`.

---

## 3. L - Liskov Substitution Principle (Sustitucion de Liskov)

- Si el usuario no existe en la base de datos tras autenticarse en Auth, `LoginHandler` arroja:
  ```javascript
  throw new BusinessError('Usuario no encontrado en la base de datos', 404);
  ```
- `BusinessError` hereda de la clase estandar `Error` de JavaScript. El middleware centralizado `errorHandler.js` lo procesa de manera polimorfica y responde con el formato estandar JSON.

---

## 4. I - Interface Segregation Principle (Segregacion de Interfaces)

- `LoginHandler` solo necesita consultar datos del usuario, por lo que recibe inyectado `userReadModel` (que solo expone `findById`).
- No recibe `userRepository`, impidiendo que el flujo de login pueda mutar o crear usuarios accidentalmente.
- Los contratos se encuentran tipados formalmente en `src/contracts/index.js` (`IAuthService`, `IUserReadModel`, `ITokenService`).

---

## 5. D - Dependency Inversion Principle (Inversion de Dependencias)

- `LoginHandler` no hace `require('../services/AuthService')` ni instancia clientes.
- Recibe todas sus dependencias mediante inyeccion por constructor:
  ```javascript
  constructor({ authService, userReadModel, tokenService }) {
    this.authService = authService;
    this.userReadModel = userReadModel;
    this.tokenService = tokenService;
  }
  ```
- El ensamblaje concreto se realiza en `src/config/container.js`.
