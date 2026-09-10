class User {
  constructor({ id, email, fullName, role, createdAt }) {
    this.id = id;
    this.email = email;
    this.fullName = fullName;
    this.role = role;
    this.createdAt = createdAt;
  }

  isAdmin() {
    return this.role === 'administrador';
  }

  isGerente() {
    return this.role === 'gerente';
  }
}

module.exports = User;
