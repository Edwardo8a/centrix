const ExpenseStatus = require('../enums/ExpenseStatus');

class Expense {
  constructor({ id, concept, amount, costCenter, date, status = ExpenseStatus.PENDIENTE, createdBy, approvedBy, createdAt, updatedAt }) {
    this.id = id;
    this.concept = concept;
    this.amount = amount;
    this.costCenter = costCenter;
    this.date = date;
    this.status = status;
    this.createdBy = createdBy;
    this.approvedBy = approvedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

module.exports = Expense;
