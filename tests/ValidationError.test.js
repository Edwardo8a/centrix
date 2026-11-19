const ValidationError = require('../src/exceptions/ValidationError');

describe('ValidationError', () => {
  it('debe crear con string por defecto', () => {
    // Arrange & Act
    const err = new ValidationError('mensaje');
    
    // Assert
    expect(err.message).toBe('mensaje');
    expect(err.statusCode).toBe(400);
    expect(err.errors).toBeNull();
    expect(err.name).toBe('ValidationError');
  });

  it('debe crear con array de errores y statusCode opcional', () => {
    // Arrange
    const errs = ['e1', 'e2'];
    
    // Act
    const err = new ValidationError(errs, 422);
    
    // Assert
    expect(err.message).toBe('Error de validación');
    expect(err.errors).toBe(errs);
    expect(err.statusCode).toBe(422);
  });
});
