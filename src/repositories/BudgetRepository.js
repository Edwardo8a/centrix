const fs = require('fs');
const path = require('path');
const { VALID_CATEGORIES } = require('../enums/ResourceRequestCategory');

const BUDGET_FILE = path.join(__dirname, '../../data/department_budgets.json');

// Categorías por defecto y montos iniciales (en centavos para precisión financiera)
const DEFAULT_ALLOCATIONS = {
  'Equipo': 5000000,      // $50,000.00 MXN
  'Mobiliario': 3000000,  // $30,000.00 MXN
  'Material': 2500000,    // $25,000.00 MXN
  'Papeleria': 1500000,   // $15,000.00 MXN
  'Economico': 2000000,   // $20,000.00 MXN
  'Otro': 1000000         // $10,000.00 MXN
};

class BudgetRepository {
  constructor({ supabase }) {
    this.supabase = supabase;
    this._ensureStorage();
  }

  _ensureStorage() {
    const dir = path.dirname(BUDGET_FILE);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (_) {}
    }
    if (!fs.existsSync(BUDGET_FILE)) {
      try {
        fs.writeFileSync(BUDGET_FILE, JSON.stringify({}, null, 2), 'utf8');
      } catch (_) {}
    }
  }

  _readBudgets() {
    try {
      this._ensureStorage();
      const content = fs.readFileSync(BUDGET_FILE, 'utf8');
      return JSON.parse(content || '{}');
    } catch (_) {
      return {};
    }
  }

  _writeBudgets(data) {
    try {
      this._ensureStorage();
      fs.writeFileSync(BUDGET_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error guardando presupuestos locales:', err.message);
    }
  }

  getKey(departmentId, year, month) {
    return `${departmentId}_${year}_${month}`;
  }

  async getAllocations(departmentId, year, month) {
    try {
      const { data, error } = await this.supabase
        .from('department_budgets')
        .select('allocations')
        .eq('department_id', departmentId)
        .eq('year', Number(year))
        .eq('month', Number(month))
        .maybeSingle();

      if (!error && data && data.allocations) {
        return { ...DEFAULT_ALLOCATIONS, ...data.allocations };
      }
    } catch (_) {}

    const key = this.getKey(departmentId, year, month);
    const store = this._readBudgets();
    if (store[key]) {
      return store[key];
    }
    return { ...DEFAULT_ALLOCATIONS };
  }

  async updateAllocations(departmentId, year, month, allocations) {
    try {
      const { data, error } = await this.supabase
        .from('department_budgets')
        .upsert({
          department_id: departmentId,
          year: Number(year),
          month: Number(month),
          allocations: allocations,
          updated_at: new Date().toISOString()
        }, { onConflict: 'department_id,year,month' })
        .select()
        .maybeSingle();

      if (!error && data && data.allocations) {
        const key = this.getKey(departmentId, year, month);
        const store = this._readBudgets();
        store[key] = { ...allocations };
        this._writeBudgets(store);
        return data.allocations;
      }
    } catch (_) {}

    const key = this.getKey(departmentId, year, month);
    const store = this._readBudgets();
    store[key] = { ...allocations };
    this._writeBudgets(store);
    return store[key];
  }

  async getDepartmentBudget(departmentId, year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
    const allocations = await this.getAllocations(departmentId, year, month);

    // Consultar solicitudes aprobadas y pendientes de este departamento
    const { data: requests, error } = await this.supabase
      .from('resource_requests')
      .select('id, category, estimated_amount, status, created_at')
      .eq('department_id', departmentId)
      .is('deleted_at', null);

    if (error) throw error;

    const filteredRequests = (requests || []).filter(r => {
      if (!r.created_at) return true;
      const d = new Date(r.created_at);
      return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
    });

    const categorySpent = {};
    for (const cat of VALID_CATEGORIES) {
      categorySpent[cat] = 0;
    }

    let totalSpent = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    for (const req of filteredRequests) {
      const amountCents = req.estimated_amount ? Math.round(Number(req.estimated_amount) * 100) : 0;
      if (req.status === 'Aprobada') {
        const cat = req.category || 'Otro';
        categorySpent[cat] = (categorySpent[cat] || 0) + amountCents;
        totalSpent += amountCents;
      } else if (req.status === 'Pendiente') {
        pendingCount++;
        pendingAmount += amountCents;
      }
    }

    let totalBudget = 0;
    const categories = [];

    for (const [category, allocated] of Object.entries(allocations)) {
      const spent = categorySpent[category] || 0;
      const available = Math.max(0, allocated - spent);
      totalBudget += allocated;
      categories.push({
        category,
        allocatedCents: allocated,
        spentCents: spent,
        availableCents: available,
        percentageUsed: allocated > 0 ? Number(((spent / allocated) * 100).toFixed(1)) : 0
      });
    }

    const availableBudget = Math.max(0, totalBudget - totalSpent);

    return {
      departmentId,
      year: Number(year),
      month: Number(month),
      totalBudgetCents: totalBudget,
      totalSpentCents: totalSpent,
      availableBudgetCents: availableBudget,
      pendingCount,
      pendingAmountCents: pendingAmount,
      percentageUsed: totalBudget > 0 ? Number(((totalSpent / totalBudget) * 100).toFixed(1)) : 0,
      categories
    };
  }

  async getDepartmentReport(departmentId, year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
    const { data: requests, error } = await this.supabase
      .from('resource_requests')
      .select(`
        id,
        title,
        description,
        category,
        estimated_amount,
        status,
        department_id,
        rejection_reason,
        created_at,
        creator:users!created_by (id, full_name, email),
        reviewer:users!reviewed_by (id, full_name)
      `)
      .eq('department_id', departmentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const filtered = (requests || []).filter(r => {
      if (!r.created_at) return true;
      const d = new Date(r.created_at);
      return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
    });

    let totalRequestedCents = 0;
    let totalApprovedCents = 0;
    const statusCounts = {
      Pendiente: 0,
      Aprobada: 0,
      Rechazada: 0,
      'En proceso': 0,
      Completada: 0,
      Cancelada: 0
    };

    const mappedRequests = filtered.map(item => {
      const amountCents = item.estimated_amount ? Math.round(Number(item.estimated_amount) * 100) : 0;
      totalRequestedCents += amountCents;
      if (item.status === 'Aprobada') {
        totalApprovedCents += amountCents;
      }
      statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;

      return {
        requestId: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        amountCents,
        status: item.status,
        createdAt: item.created_at,
        applicant: item.creator ? item.creator.full_name : 'Desconocido',
        applicantEmail: item.creator ? item.creator.email : null,
        reviewer: item.reviewer ? item.reviewer.full_name : null,
        rejectionReason: item.rejection_reason || null
      };
    });

    return {
      departmentId,
      year: Number(year),
      month: Number(month),
      totalRequests: mappedRequests.length,
      totalRequestedCents,
      totalApprovedCents,
      statusCounts,
      requests: mappedRequests
    };
  }
}

module.exports = BudgetRepository;
