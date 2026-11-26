const BusinessError = require('../exceptions/BusinessError');

class DepartmentRepository {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async create(department) {
    const { data, error } = await this.supabase
      .from('departments')
      .insert({ name: department.name, description: department.description })
      .select('id, name, description')
      .single();

    if (error?.code === '23505') {
      throw new BusinessError('Ya existe un departamento con ese nombre', 409);
    }
    if (error) throw error;

    return data;
  }
}

module.exports = DepartmentRepository;
