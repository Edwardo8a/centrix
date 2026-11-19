const { randomUUID } = require('crypto');

const ids = {
  department: '10000000-0000-4000-8000-000000000001',
  otherDepartment: '10000000-0000-4000-8000-000000000002',
  creator: '20000000-0000-4000-8000-000000000001',
  manager: '20000000-0000-4000-8000-000000000002',
  solver: '20000000-0000-4000-8000-000000000003',
  outsider: '20000000-0000-4000-8000-000000000004',
  admin: '20000000-0000-4000-8000-000000000005'
};

function createMemorySupabase() {
  const state = { tables: {}, objects: new Map(), failInsert: false, failSigning: false };
  state.reset = () => {
    state.tables = { tickets: [], ticket_attachments: [], user_roles: [],
      roles: [{ id: 1, descripcion: 'administrador' }, { id: 2, descripcion: 'gerente' },
        { id: 3, descripcion: 'Colaborador' }, { id: 4, descripcion: 'soporte_tecnico' }],
      departments: [{ id: ids.department, name: 'Operaciones' }, { id: ids.otherDepartment, name: 'Soporte TI' }], users: [
      ['creator', 'colaborador', ids.department], ['manager', 'gerente', ids.department],
      ['solver', 'soporte_tecnico', ids.department], ['outsider', 'gerente', ids.otherDepartment], ['admin', 'administrador', null]
    ].map(([name, role, department]) => ({ id: ids[name], full_name: name, department_id: department, user_roles: [{ roles: { descripcion: role } }] })) };
    state.objects.clear(); state.failInsert = false; state.failSigning = false;
    state.failRoleInsert = false; state.autoRoleOnUserCreate = null;
  };
  state.reset();

  function from(table) {
    const filters = []; let insert = null; let update = null; let bounds = null; let deleting = false;
    const builder = {
      select() { return this; },
      insert(rows) { insert = Array.isArray(rows) ? rows : [rows]; return this; },
      update(row) { update = row; return this; },
      delete() { deleting = true; return this; },
      ilike(key, value) { filters.push(row => String(row[key]).toLowerCase() === value.toLowerCase()); return this; },
      eq(key, value) { filters.push(row => row[key] === value); return this; },
      is(key, value) { filters.push(row => (row[key] ?? null) === value); return this; },
      in(key, values) { filters.push(row => values.includes(row[key])); return this; },
      order() { return this; },
      range(start, end) { bounds = [start, end]; return this; },
      execute(single = false) {
        if (insert && state.failInsert && table === 'ticket_attachments') return { data: null, error: new Error('Storage metadata unavailable') };
        if (insert && state.failRoleInsert && table === 'user_roles') return { data: null, error: new Error('Role insert unavailable') };
        if (insert) {
          const created = insert.map(row => ({ id: randomUUID(), created_at: new Date().toISOString(), deleted_at: null, ...row }));
          state.tables[table].push(...created);
          if (table === 'users' && state.autoRoleOnUserCreate) {
            state.tables.user_roles.push(...created.map(user => ({ user_id: user.id, role_id: state.autoRoleOnUserCreate })));
          }
          return { data: single ? created[0] : created, error: null };
        }
        let rows = (state.tables[table] || []).filter(row => filters.every(filter => filter(row)));
        if (deleting) { state.tables[table] = state.tables[table].filter(row => !rows.includes(row)); return { data: rows, error: null }; }
        if (update) rows.forEach(row => Object.assign(row, update));
        const count = rows.length;
        if (bounds) rows = rows.slice(bounds[0], bounds[1] + 1);
        if (table === 'tickets') rows = rows.map(row => ({ ...row,
          creator: state.tables.users.find(user => user.id === row.created_by),
          assignee: state.tables.users.find(user => user.id === row.assigned_to),
          attachments: state.tables.ticket_attachments.filter(att => att.ticket_id === row.id)
        }));
        if (table === 'users') rows = rows.map(row => ({ ...row, user_roles: row.user_roles ||
          state.tables.user_roles.filter(link => link.user_id === row.id).map(link => ({ roles: state.tables.roles.find(role => role.id === link.role_id) })) }));
        return { data: single ? rows[0] || null : rows, error: null, count };
      },
      single() { return Promise.resolve(this.execute(true)); },
      maybeSingle() { return Promise.resolve(this.execute(true)); },
      then(resolve, reject) { return Promise.resolve(this.execute()).then(resolve, reject); }
    };
    return builder;
  }

  const storage = { from(bucket) {
    return {
      async upload(path, bytes) { state.objects.set(`${bucket}/${path}`, bytes); return { error: null }; },
      async remove(paths) { paths.forEach(path => state.objects.delete(`${bucket}/${path}`)); return { error: null }; },
      async createSignedUrl(path) {
        return state.failSigning ? { error: new Error('Signing unavailable') }
          : { data: { signedUrl: `https://storage.test/${bucket}/${path}?signed=true` }, error: null };
      },
      async createSignedUrls(paths) { return { data: paths.map(path => ({ path, signedUrl: `https://storage.test/${bucket}/${path}?signed=true` })), error: null }; }
    };
  } };
  const client = { from, storage, async rpc(name, args) {
    const ticket = state.tables.tickets.find(row => row.id === args.p_ticket_id);
    if (!ticket) return { error: { code: 'P0002' } };
    if (name === 'assign_ticket_transactional') ticket.assigned_to = args.p_assigned_to;
    if (name === 'update_ticket_status_transactional') {
      const previousStatus = ticket.status;
      ticket.status = args.p_new_status;
      return { data: { id: ticket.id, status: ticket.status, previousStatus }, error: null };
    }
    return { data: { id: ticket.id }, error: null };
  } };
  return { client, state, ids };
}

module.exports = { createMemorySupabase, ids };
