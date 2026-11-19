const Ticket = require('../src/models/Ticket');
const BusinessError = require('../src/exceptions/BusinessError');

describe('Ticket Model', () => {
  const validData = {
    title: 'Test',
    description: 'Test desc',
    priority: 'Baja',
    department_id: 'dep1',
    created_by: 'user1'
  };

  it('debe lanzar BusinessError si falta la descripcion', () => {
    const data = { ...validData, description: '' };

    let caughtError;
    try {
      new Ticket(data);
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(BusinessError);
    expect(caughtError.message).toBe('La descripción es obligatoria');
    expect(caughtError.statusCode).toBe(400);
  });

  it('debe lanzar BusinessError si falta el departamento', () => {
    const data = { ...validData, department_id: null };

    let caughtError;
    try {
      new Ticket(data);
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeInstanceOf(BusinessError);
    expect(caughtError.message).toBe('El departamento es obligatorio');
    expect(caughtError.statusCode).toBe(400);
  });
});
