export interface TicketViewModel {
  ticketId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAtIso: string;
  updatedAtIso?: string;
  authorName?: string;
  assignedToName?: string;
  author?: {
    id: string;
    fullName: string;
    email: string;
  };
  assignee?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  attachments?: Array<{
    attachmentId: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
}

export interface ITicketReadModel {
  getTicketsByUserForViewModel(userId: string): Promise<TicketViewModel[]>;
  getTicketByIdForViewModel(ticketId: string): Promise<TicketViewModel>;
  getPendingTicketsForManager(): Promise<TicketViewModel[]>;
}

export interface ExpenseViewModel {
  expenseId: string;
  concept: string;
  amount: number;
  costCenter: string;
  dateIso: string;
  status: string;
  approvedByName?: string | null;
  applicantName?: string;
  applicantEmail?: string;
  receiptsCount?: number;
  receiptUrls?: string[];
  receipts?: string[];
}

export interface IExpenseReadModel {
  getExpensesByUserForViewModel(userId: string): Promise<ExpenseViewModel[]>;
  getPendingExpensesForManager(): Promise<ExpenseViewModel[]>;
}

export interface DashboardSummaryViewModel {
  totalTickets: number;
  totalExpenses: number;
  totalApprovedExpensesAmount: number;
}

export interface AuditLogViewModel {
  logId: string;
  action: string;
  tableAffected: string;
  recordId: string;
  timestampIso: string;
  performedBy: string;
}

export interface IAdminReportReadModel {
  getDashboardSummaryForViewModel(): Promise<DashboardSummaryViewModel>;
  getAuditLogsForViewModel(limit?: number): Promise<AuditLogViewModel[]>;
}
