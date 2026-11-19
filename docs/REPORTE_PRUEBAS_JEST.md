# Reporte de Pruebas Automatizadas (Jest) - Centrix Backend

**Materia:** Gestión del Proceso de Desarrollo de Software (GPDS)  
**Actividad:** Prueba automatizada (Segundo Parcial)  
**Proyecto Integrador:** Centrix (Sistema de Gestión Integral de Incidencias y Departamentos)  
**Framework de Pruebas:** Jest (`v29.x`)  
**Entorno de Ejecución:** Node.js (v22.x)  
**Metodología / Patrón:** AAA (Arrange, Act, Assert)  

---

## 1. Contexto de la Función / Caso de Estudio

- **Función / Caso de uso bajo prueba principal:** `LoginHandler` y flujo de autenticación de usuarios.
- **Entrada:** `LoginCommand` con `{ email, password }`.
- **Salida esperada:** Objeto con los datos del perfil y token (`{ user: { id, email, fullName, role, roles, tel }, token }`), o excepciones de negocio (`BusinessError` con código HTTP 401 o 404).
- **Herramienta de automatización:** Jest con Inyección de Dependencias (mocks de `authService`, `userReadModel`, `tokenService`).

---

## 2. Código Bajo Prueba (`src/commands/auth/LoginHandler.js`)

```javascript
const BusinessError = require('../../exceptions/BusinessError');

class LoginHandler {
  /**
   * @param {{ authService: import('../../contracts').IAuthService, userReadModel: import('../../contracts').IUserReadModel, tokenService: import('../../contracts').ITokenService }} deps
   */
  constructor({ authService, userReadModel, tokenService }) {
    this.authService = authService;
    this.userReadModel = userReadModel;
    this.tokenService = tokenService;
  }

  async handle(command) {
    const { authId } = await this.authService.signIn(command.email, command.password);

    const user = await this.userReadModel.findById(authId);
    if (!user) {
      throw new BusinessError('Usuario no encontrado en la base de datos', 404);
    }

    const token = this.tokenService.generateToken({
      id: user.id,
      email: command.email,
      role: user.role,
      roles: user.roles
    });

    const fullName = `${user.nombre} ${user.apellido_pat || ''} ${user.apellido_mat || ''}`.trim();

    return {
      user: {
        id: user.id,
        email: command.email,
        fullName: fullName,
        role: user.role,
        roles: user.roles,
        tel: user.tel
      },
      token
    };
  }
}

module.exports = LoginHandler;
```

---

## 3. Casos de Prueba con Patrón AAA (Arrange - Act - Assert)

A continuación se presentan los **5 casos de prueba unitarios automatizados** diseñados siguiendo estrictamente el patrón **AAA**:

```javascript
const LoginHandler = require('../commands/auth/LoginHandler');
const LoginCommand = require('../commands/auth/LoginCommand');
const BusinessError = require('../exceptions/BusinessError');

describe('Pruebas Automatizadas con Patrón AAA - LoginHandler', () => {
  let mockAuthService;
  let mockUserReadModel;
  let mockTokenService;
  let handler;

  beforeEach(() => {
    mockAuthService = { signIn: jest.fn() };
    mockUserReadModel = { findById: jest.fn() };
    mockTokenService = { generateToken: jest.fn() };

    handler = new LoginHandler({
      authService: mockAuthService,
      userReadModel: mockUserReadModel,
      tokenService: mockTokenService
    });
  });

  // =========================================================================
  // CASO 1: Inicio de sesión exitoso con generación de token JWT
  // =========================================================================
  it('CP01: Debe autenticar y retornar el usuario formateado con su token JWT', async () => {
    // // ARRANGE (Preparar dependencias, mocks y datos de entrada)
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-uuid-123' });
    mockUserReadModel.findById.mockResolvedValue({
      id: 'usr-uuid-123',
      nombre: 'Juan',
      apellido_pat: 'Perez',
      apellido_mat: 'Lopez',
      tel: '4271234567',
      role: 'administrador',
      roles: ['administrador']
    });
    mockTokenService.generateToken.mockReturnValue('jwt-token-valido-xyz');

    const command = new LoginCommand({
      email: 'juan.perez@empresa.com',
      password: 'PasswordSeguro123!'
    });

    // // ACT (Ejecutar la unidad bajo prueba)
    const result = await handler.handle(command);

    // // ASSERT (Verificar resultados y llamadas esperadas)
    expect(result).toEqual({
      user: {
        id: 'usr-uuid-123',
        email: 'juan.perez@empresa.com',
        fullName: 'Juan Perez Lopez',
        role: 'administrador',
        roles: ['administrador'],
        tel: '4271234567'
      },
      token: 'jwt-token-valido-xyz'
    });
    expect(mockAuthService.signIn).toHaveBeenCalledWith('juan.perez@empresa.com', 'PasswordSeguro123!');
    expect(mockUserReadModel.findById).toHaveBeenCalledWith('auth-uuid-123');
    expect(mockTokenService.generateToken).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // CASO 2: Credenciales inválidas rechazan la petición con 401
  // =========================================================================
  it('CP02: Debe lanzar BusinessError 401 si las credenciales en Auth fallan', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockRejectedValue(new BusinessError('Credenciales invalidas', 401));
    const command = new LoginCommand({
      email: 'usuario@correo.com',
      password: 'passwordIncorrecto'
    });

    // // ACT & // ASSERT
    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toHaveProperty('statusCode', 401);
    expect(mockUserReadModel.findById).not.toHaveBeenCalled();
    expect(mockTokenService.generateToken).not.toHaveBeenCalled();
  });

  // =========================================================================
  // CASO 3: Usuario autenticado en Auth pero inexistente en tabla de negocio
  // =========================================================================
  it('CP03: Debe lanzar BusinessError 404 si el usuario no tiene registro en base de datos', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-huerfano-456' });
    mockUserReadModel.findById.mockResolvedValue(null);

    const command = new LoginCommand({
      email: 'huerfano@correo.com',
      password: 'Password123'
    });

    // // ACT & // ASSERT
    await expect(handler.handle(command)).rejects.toThrow(BusinessError);
    await expect(handler.handle(command)).rejects.toHaveProperty('statusCode', 404);
    expect(mockTokenService.generateToken).not.toHaveBeenCalled();
  });

  // =========================================================================
  // CASO 4: Formateo de nombre completo sin apellido materno opcional
  // =========================================================================
  it('CP04: Debe concatenar correctamente el nombre sin apellido materno (espacios limpios)', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-single-last' });
    mockUserReadModel.findById.mockResolvedValue({
      id: 'usr-456',
      nombre: 'Maria',
      apellido_pat: 'Gomez',
      apellido_mat: null,
      tel: '4429876543',
      role: 'colaborador',
      roles: ['colaborador']
    });
    mockTokenService.generateToken.mockReturnValue('jwt-token-maria');

    const command = new LoginCommand({
      email: 'maria.gomez@empresa.com',
      password: 'Password123!'
    });

    // // ACT
    const result = await handler.handle(command);

    // // ASSERT
    expect(result.user.fullName).toBe('Maria Gomez');
    expect(result.user.role).toBe('colaborador');
  });

  // =========================================================================
  // CASO 5: Parámetros transferidos a la firma del JWT son íntegros
  // =========================================================================
  it('CP05: Debe pasar los claims correctos (id, email, roles) al TokenService', async () => {
    // // ARRANGE
    mockAuthService.signIn.mockResolvedValue({ authId: 'auth-789' });
    mockUserReadModel.findById.mockResolvedValue({
      id: 'usr-789',
      nombre: 'Carlos',
      apellido_pat: 'Ruiz',
      apellido_mat: 'Diaz',
      tel: '112233',
      role: 'gerente',
      roles: ['gerente', 'soporte']
    });
    mockTokenService.generateToken.mockReturnValue('token-claims-test');

    const command = new LoginCommand({
      email: 'carlos.ruiz@empresa.com',
      password: 'Password123!'
    });

    // // ACT
    await handler.handle(command);

    // // ASSERT
    expect(mockTokenService.generateToken).toHaveBeenCalledWith({
      id: 'usr-789',
      email: 'carlos.ruiz@empresa.com',
      role: 'gerente',
      roles: ['gerente', 'soporte']
    });
  });
});
```

---

## 4. Resultados de Ejecución y Reporte de Jest

### 4.1. Resumen de Ejecución en Consola

```bash
> proyecto-app-backend@1.0.0 test
> jest --coverage

PASS src/__tests__/app.test.js
PASS src/__tests__/GetAllDepartmentsQuery.test.js
PASS src/__tests__/GetTicketsByDepartmentQuery.test.js
PASS src/__tests__/CreateUserHandler.test.js
PASS src/__tests__/LoginHandler.test.js
PASS src/__tests__/CreateTicketHandler.test.js

---------------------------------|---------|----------|---------|---------|-------------------
File                             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------------------|---------|----------|---------|---------|-------------------
All files                        |   97.46 |    74.19 |     100 |   97.46 |                   
 commands/admin                  |     100 |      100 |     100 |     100 |                   
  CreateUserCommand.js           |     100 |      100 |     100 |     100 |                   
  CreateUserHandler.js           |     100 |      100 |     100 |     100 |                   
 commands/auth                   |     100 |    66.66 |     100 |     100 |                   
  LoginCommand.js                |     100 |      100 |     100 |     100 |                   
  LoginHandler.js                |     100 |    66.66 |     100 |     100 |                   
 commands/tickets                |     100 |      100 |     100 |     100 |                   
  CreateTicketCommand.js         |     100 |      100 |     100 |     100 |                   
  CreateTicketHandler.js         |     100 |      100 |     100 |     100 |                   
 exceptions                      |     100 |    33.33 |     100 |     100 |                   
  BusinessError.js               |     100 |        0 |     100 |     100 |                   
  ValidationError.js             |     100 |       40 |     100 |     100 |                   
 models                          |   88.88 |    89.47 |     100 |   88.88 |                   
  Ticket.js                      |   88.88 |    89.47 |     100 |   88.88 |                   
 queries/departments             |     100 |      100 |     100 |     100 |                   
  GetAllDepartmentsQuery.js      |     100 |      100 |     100 |     100 |                   
 queries/tickets                 |     100 |      100 |     100 |     100 |                   
  GetTicketsByDepartmentQuery.js |     100 |      100 |     100 |     100 |                   
---------------------------------|---------|----------|---------|---------|-------------------

Test Suites: 6 passed, 6 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        11.172 s
```

### 4.2. Reporte HTML Interactivo Generado
Jest genera automáticamente el reporte gráfico de cobertura en la carpeta:
`centrixBack/coverage/lcov-report/index.html`

- **Cobertura de Sentencias (Statements):** 97.46%
- **Cobertura de Funciones (Functions):** 100%
- **Cobertura de Líneas (Lines):** 97.46%
- **Total de pruebas aprobadas:** 16 de 16 (100% exitosas)
