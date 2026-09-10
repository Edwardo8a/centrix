export interface ITicketRepository {
  create(ticketData: {
    title: string;
    description: string;
    category: string;
    status?: string;
    created_by: string;
  }): Promise<any>;

  findById(id: string): Promise<any>;

  findByUser(userId: string): Promise<any[]>;

  updateStatus(id: string, status: string): Promise<any>;

  assign(ticketId: string, assigneeId: string, assignedBy: string): Promise<any>;
}

export interface IExpenseRepository {
  create(expenseData: {
    concept: string;
    amount: number;
    cost_center: string;
    date: string;
    status?: string;
    created_by: string;
  }): Promise<any>;

  findByUser(userId: string): Promise<any[]>;

  updateStatus(id: string, status: string, approverId: string): Promise<any>;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<any | null>;

  findById(id: string): Promise<any | null>;

  create(userData: {
    email: string;
    password_hash: string;
    full_name: string;
    role?: string;
  }): Promise<any>;
}

export interface IApprovalRepository {
  create(approvalData: {
    request_type: 'ticket' | 'expense';
    request_id: string;
    approver_id: string;
    action: 'approved' | 'rejected' | 'requested_changes';
    comments?: string;
  }): Promise<any>;
}
