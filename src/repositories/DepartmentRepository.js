const supabase = require('../config/supabaseClient');

class DepartmentRepository {
  async getAllDepartments() {
    const { data, error } = await supabase
      .from('departments')
      .select('*');
    if (error) throw error;
    return data;
  }
}

module.exports = DepartmentRepository;
