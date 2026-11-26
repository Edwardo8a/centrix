const RESOURCE_REQUEST_SUMMARY_SELECT = `
  id,
  title,
  description,
  category,
  estimated_amount,
  status,
  department_id,
  created_at,
  updated_at,
  creator:users!created_by (id, full_name, email),
  reviewer:users!reviewed_by (id, full_name)
`;

const RESOURCE_REQUEST_DETAIL_SELECT = `
  id,
  title,
  description,
  category,
  estimated_amount,
  status,
  department_id,
  created_by,
  reviewed_by,
  rejection_reason,
  created_at,
  updated_at,
  creator:users!created_by (id, full_name, email),
  reviewer:users!reviewed_by (id, full_name),
  department:departments!department_id (id, name)
`;

class ResourceRequestReadModel {
  constructor({ supabase }) {
    this.supabase = supabase;
  }

  _mapSummary(item) {
    return {
      requestId: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      estimatedAmount: item.estimated_amount !== null ? Number(item.estimated_amount) : null,
      status: item.status,
      departmentId: item.department_id,
      createdAtIso: item.created_at,
      updatedAtIso: item.updated_at ?? null,
      authorName: item.creator ? item.creator.full_name : 'Desconocido',
      authorEmail: item.creator ? item.creator.email : null,
      reviewerName: item.reviewer ? item.reviewer.full_name : 'Sin revisar'
    };
  }

  async getRequestsByCreator(userId) {
    const { data, error } = await this.supabase
      .from('resource_requests')
      .select(RESOURCE_REQUEST_SUMMARY_SELECT)
      .eq('created_by', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(r => this._mapSummary(r));
  }

  async getRequestsByDepartment(departmentId, { status = null, category = null, search = null, month = null, year = null, page = 1, limit = 50 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let queryBuilder = this.supabase
      .from('resource_requests')
      .select(RESOURCE_REQUEST_SUMMARY_SELECT, { count: 'exact' })
      .eq('department_id', departmentId)
      .is('deleted_at', null);

    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      queryBuilder = queryBuilder.or(`title.ilike.${term},description.ilike.${term}`);
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    let items = (data || []).map(r => this._mapSummary(r));

    if (month || year) {
      items = items.filter(r => {
        if (!r.createdAtIso) return true;
        const d = new Date(r.createdAtIso);
        const matchYear = year ? d.getFullYear() === Number(year) : true;
        const matchMonth = month ? (d.getMonth() + 1) === Number(month) : true;
        return matchYear && matchMonth;
      });
    }

    const total = count ?? items.length;
    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit)
      }
    };
  }

  async getRequestById(requestId) {
    const { data, error } = await this.supabase
      .from('resource_requests')
      .select(RESOURCE_REQUEST_DETAIL_SELECT)
      .eq('id', requestId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      requestId: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      estimatedAmount: data.estimated_amount !== null ? Number(data.estimated_amount) : null,
      status: data.status,
      departmentId: data.department_id,
      departmentName: data.department ? data.department.name : null,
      createdBy: data.created_by,
      reviewedBy: data.reviewed_by ?? null,
      rejectionReason: data.rejection_reason ?? null,
      createdAtIso: data.created_at,
      updatedAtIso: data.updated_at ?? null,
      authorName: data.creator ? data.creator.full_name : 'Desconocido',
      authorEmail: data.creator ? data.creator.email : null,
      reviewerName: data.reviewer ? data.reviewer.full_name : 'Sin revisar'
    };
  }
}

module.exports = ResourceRequestReadModel;
