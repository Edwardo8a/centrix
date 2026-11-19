class ResourceRequestRepository {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  async create(requestData) {
    const { data, error } = await this.supabase
      .from('resource_requests')
      .insert({
        title: requestData.title,
        description: requestData.description,
        category: requestData.category,
        estimated_amount: requestData.estimated_amount,
        status: requestData.status,
        department_id: requestData.department_id,
        created_by: requestData.created_by
      })
      .select('id')
      .single();

    if (error) throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await this.supabase
      .from('resource_requests')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async softDelete(requestId, userId) {
    const { data, error } = await this.supabase
      .from('resource_requests')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', requestId)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}

module.exports = ResourceRequestRepository;
