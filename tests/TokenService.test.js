const TokenService = require('../src/services/TokenService');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('TokenService', () => {
  let tokenService;
  const jwtConfig = { secret: 'test-secret', expiresIn: '1h' };

  beforeEach(() => {
    tokenService = new TokenService({ jwtConfig });
  });

  it('debe generar un token correctamente', () => {
    // Arrange
    const payload = { id: 1, role: 'admin' };
    const expectedToken = 'token-falso';
    jwt.sign.mockReturnValue(expectedToken);

    // Act
    const result = tokenService.generateToken(payload);

    // Assert
    expect(jwt.sign).toHaveBeenCalledWith(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
    expect(result).toBe(expectedToken);
  });
});
