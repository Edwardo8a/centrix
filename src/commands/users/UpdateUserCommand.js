class UpdateUserCommand {
  constructor({
    userId,
    nombre = undefined,
    apellido_pat = undefined,
    apellido_mat = undefined,
    tel = undefined,
    departmentId = undefined,
    role = undefined
  }) {
    this.userId = userId;
    this.nombre = nombre;
    this.apellido_pat = apellido_pat;
    this.apellido_mat = apellido_mat;
    this.tel = tel;
    this.departmentId = departmentId;
    this.role = role;
    Object.freeze(this);
  }
}

module.exports = UpdateUserCommand;
