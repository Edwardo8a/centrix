class CreateUserCommand {
  constructor({ email, password, nombre, apellido_pat, apellido_mat, tel, role = 'colaborador', department_id = null }) {
    this.email = email;
    this.password = password;
    this.nombre = nombre;
    this.apellido_pat = apellido_pat;
    this.apellido_mat = apellido_mat;
    this.tel = tel;
    this.role = role;
    this.department_id = department_id;
  }
}

module.exports = CreateUserCommand;
