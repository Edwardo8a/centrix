const User = require('../src/models/User');

describe('User Model', () => {
  it('debe crear un usuario y validar si es admin', () => {
    // Arrange
    const data = { id: 1, email: 'admin@test.com', fullName: 'Admin', role: 'administrador', createdAt: new Date() };

    // Act
    const user = new User(data);

    // Assert
    expect(user.isAdmin()).toBe(true);
    expect(user.isGerente()).toBe(false);
  });

  it('debe crear un usuario y validar si es gerente', () => {
    // Arrange
    const data = { id: 2, email: 'gerente@test.com', fullName: 'Gerente', role: 'gerente', createdAt: new Date() };

    // Act
    const user = new User(data);

    // Assert
    expect(user.isAdmin()).toBe(false);
    expect(user.isGerente()).toBe(true);
  });
});
