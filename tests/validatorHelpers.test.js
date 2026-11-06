const { validateResult } = require('../src/utils/validatorHelpers');
const { validationResult } = require('express-validator');

jest.mock('express-validator');

describe('validatorHelpers', () => {
  it('debe llamar a next sin errores si validationResult esta vacio', () => {
    // Arrange
    validationResult.mockReturnValue({ isEmpty: () => true });
    const req = {}, res = {}, next = jest.fn();

    // Act
    validateResult(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledWith();
  });

  it('debe llamar a next con Error si hay errores de validacion', () => {
    // Arrange
    validationResult.mockReturnValue({ isEmpty: () => false, array: () => ['error'] });
    const req = {}, res = {}, next = jest.fn();

    // Act
    validateResult(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
