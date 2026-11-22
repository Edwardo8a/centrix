const CreateDepartmentCommand = require('../commands/departments/CreateDepartmentCommand');
const ResponseBuilder = require('../utils/responseBuilder');

const departmentCommandControllerFactory = ({ createDepartmentHandler }) => ({
  create: async (req, res, next) => {
    try {
      const command = new CreateDepartmentCommand({
        name: req.body.name,
        description: req.body.description
      });
      const result = await createDepartmentHandler.handle(command);
      return ResponseBuilder.success(res, result, 'Departamento creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }
});

module.exports = departmentCommandControllerFactory;
