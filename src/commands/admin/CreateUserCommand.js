class CreateUserCommand {
  constructor({ email, password, nombre, apellido_pat, apellido_mat, tel }) {
    this.email = email;
    this.password = password;
    this.nombre = nombre;
    this.apellido_pat = apellido_pat;
    this.apellido_mat = apellido_mat;
    this.tel = tel;
  }
}

module.exports = CreateUserCommand;
