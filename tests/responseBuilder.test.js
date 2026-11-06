const ResponseBuilder = require('../src/utils/responseBuilder');

describe('ResponseBuilder', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('debe retornar respuesta success con parametros por defecto', () => {
    // Act
    ResponseBuilder.success(res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Success', data: null });
  });

  it('debe retornar respuesta success con parametros provistos', () => {
    // Arrange
    const data = { id: 1 };
    
    // Act
    ResponseBuilder.success(res, data, 'OK', 201);

    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK', data });
  });

  it('debe retornar respuesta error con parametros por defecto', () => {
    // Act
    ResponseBuilder.error(res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error', errors: null });
  });

  it('debe retornar respuesta error con parametros provistos', () => {
    // Act
    ResponseBuilder.error(res, 'Not Found', 404, ['missing']);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not Found', errors: ['missing'] });
  });
});
