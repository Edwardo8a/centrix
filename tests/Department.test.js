const Department = require('../src/models/Department');

describe('Department Model', () => {
  it('debe crear un departamento con sus propiedades', () => {
    // Arrange
    const data = { id: 1, name: 'IT', description: 'Tech', createdAt: '2023' };

    // Act
    const dept = new Department(data);

    // Assert
    expect(dept.id).toBe(1);
    expect(dept.name).toBe('IT');
    expect(dept.description).toBe('Tech');
  });
});
