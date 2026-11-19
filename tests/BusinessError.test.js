const BusinessError = require('../src/exceptions/BusinessError');

describe('BusinessError', () => {
  it('debe crear el error con mensaje y status por defecto', () => {
    // Arrange & Act
    const err = new BusinessError('Error test');

    // Assert
    expect(err.message).toBe('Error test');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('BusinessError');
  });

  it('debe crear el error con status provisto', () => {
    // Arrange & Act
    const err = new BusinessError('Error test', 404);

    // Assert
    expect(err.statusCode).toBe(404);
  });
});
