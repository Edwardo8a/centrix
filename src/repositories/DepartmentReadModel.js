class DepartmentReadModel {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async getAll() {
    const { data, error } = await this.supabase
      .from('departments')
      .select('id, name, description')
      .order('name');

    if (error) throw error;

    return data.map(dept => ({
      departmentId: dept.id,
      name: dept.name,
      description: dept.description
    }));
  }
}

module.exports = DepartmentReadModel;
