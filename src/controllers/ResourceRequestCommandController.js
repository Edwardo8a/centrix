const CreateResourceRequestCommand = require('../commands/resource-requests/CreateResourceRequestCommand');
const DeleteResourceRequestCommand = require('../commands/resource-requests/DeleteResourceRequestCommand');
const DecideResourceRequestCommand = require('../commands/resource-requests/DecideResourceRequestCommand');
const UpdateDepartmentBudgetCommand = require('../commands/resource-requests/UpdateDepartmentBudgetCommand');
const ResponseBuilder = require('../utils/responseBuilder');

const resourceRequestCommandControllerFactory = ({
  createResourceRequestHandler,
  deleteResourceRequestHandler,
  decideResourceRequestHandler,
  updateDepartmentBudgetHandler
}) => ({
  create: async (req, res, next) => {
    try {
      const command = new CreateResourceRequestCommand({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        estimatedAmount: req.body.estimated_amount !== undefined ? (req.body.estimated_amount === null ? null : Number(req.body.estimated_amount)) : null,
        departmentId: req.body.department_id || req.user.department_id,
        userId: req.user.id
      });

      const result = await createResourceRequestHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Solicitud de recurso creada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const command = new DeleteResourceRequestCommand({
        requestId: req.params.id,
        userId: req.user.id,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const result = await deleteResourceRequestHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Solicitud de recurso eliminada exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  decide: async (req, res, next) => {
    try {
      const command = new DecideResourceRequestCommand({
        requestId: req.params.id,
        decision: req.body.status || req.body.decision,
        comment: req.body.comment ?? null,
        userId: req.user.id,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const result = await decideResourceRequestHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Decisión registrada exitosamente', 200);
    } catch (error) {
      next(error);
    }
  },

  updateBudget: async (req, res, next) => {
    try {
      const command = new UpdateDepartmentBudgetCommand({
        departmentId: req.body.department_id || req.user.department_id,
        year: req.body.year,
        month: req.body.month,
        allocations: req.body.allocations,
        userRole: req.user.role ?? null,
        userDepartmentId: req.user.department_id ?? null
      });

      const result = await updateDepartmentBudgetHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Presupuesto actualizado exitosamente', 200);
    } catch (error) {
      next(error);
    }
  }
});

module.exports = resourceRequestCommandControllerFactory;
