const { dataClient, authClient, adminClient } = require('./supabaseClient');

// Repositories
const TicketRepository = require('../repositories/TicketRepository');
const TicketReadModel = require('../repositories/TicketReadModel');
const DepartmentReadModel = require('../repositories/DepartmentReadModel');
const UserRepository = require('../repositories/UserRepository');
const UserReadModel = require('../repositories/UserReadModel');

const ticketRepository = new TicketRepository({ supabase: adminClient || dataClient });
const ticketReadModel = new TicketReadModel({
  supabase: adminClient || dataClient,
  storageClient: adminClient || dataClient
});
const departmentReadModel = new DepartmentReadModel({ supabase: dataClient });
const userRepository = new UserRepository({ supabase: dataClient });
const userReadModel = new UserReadModel({ supabase: dataClient });

// Services
const AuthService = require('../services/AuthService');
const TokenService = require('../services/TokenService');
const jwtConfig = require('./jwt');

const authService = new AuthService({ authClient, adminClient });
const tokenService = new TokenService({ jwtConfig });

// Handlers & Queries
const CreateTicketHandler = require('../commands/tickets/CreateTicketHandler');
const DeleteTicketHandler = require('../commands/tickets/DeleteTicketHandler');
const ChangeTicketStatusHandler = require('../commands/tickets/ChangeTicketStatusHandler');
const AssignTicketHandler = require('../commands/tickets/AssignTicketHandler');
const AddTicketAttachmentHandler = require('../commands/tickets/AddTicketAttachmentHandler');
const GetTicketsByDepartmentHandler = require('../queries/tickets/GetTicketsByDepartmentHandler');
const GetMyTicketsHandler = require('../queries/tickets/GetMyTicketsHandler');
const GetAssignedTicketsHandler = require('../queries/tickets/GetAssignedTicketsHandler');
const GetAllTicketsHandler = require('../queries/tickets/GetAllTicketsHandler');
const GetTicketByIdHandler = require('../queries/tickets/GetTicketByIdHandler');
const GetDepartmentSolversHandler = require('../queries/users/GetDepartmentSolversHandler');
const GetAllDepartmentsQuery = require('../queries/departments/GetAllDepartmentsQuery');
const LoginHandler = require('../commands/auth/LoginHandler');
const CreateUserHandler = require('../commands/admin/CreateUserHandler');

const createTicketHandler = new CreateTicketHandler({ ticketRepository });
const deleteTicketHandler = new DeleteTicketHandler({ ticketRepository });
const changeTicketStatusHandler = new ChangeTicketStatusHandler({ ticketRepository });
const assignTicketHandler = new AssignTicketHandler({ ticketRepository, userReadModel });
const addTicketAttachmentHandler = new AddTicketAttachmentHandler({ ticketRepository });
const getTicketsByDepartmentHandler = new GetTicketsByDepartmentHandler({ ticketReadModel });
const getMyTicketsHandler = new GetMyTicketsHandler({ ticketReadModel });
const getAssignedTicketsHandler = new GetAssignedTicketsHandler({ ticketReadModel });
const getAllTicketsHandler = new GetAllTicketsHandler({ ticketReadModel });
const getTicketByIdHandler = new GetTicketByIdHandler({ ticketReadModel });
const getDepartmentSolversHandler = new GetDepartmentSolversHandler({ userReadModel });
const getAllDepartmentsQuery = new GetAllDepartmentsQuery({ departmentReadModel });
const loginHandler = new LoginHandler({ authService, userReadModel, tokenService });
const createUserHandler = new CreateUserHandler({ authService, userRepository });

// Controllers (Factories inyectadas en el contenedor)
const ticketCommandControllerFactory = require('../controllers/TicketCommandController');
const ticketQueryControllerFactory = require('../controllers/TicketQueryController');
const userQueryControllerFactory = require('../controllers/UserQueryController');

const ticketCommandController = ticketCommandControllerFactory({
  createTicketHandler,
  deleteTicketHandler,
  changeTicketStatusHandler,
  assignTicketHandler,
  addTicketAttachmentHandler
});

const ticketQueryController = ticketQueryControllerFactory({
  getTicketsByDepartmentHandler,
  getMyTicketsHandler,
  getAssignedTicketsHandler,
  getAllTicketsHandler,
  getTicketByIdHandler
});

const userQueryController = userQueryControllerFactory({
  getDepartmentSolversHandler
});

module.exports = {
  userReadModel,
  ticketRepository,
  ticketReadModel,
  createTicketHandler,
  deleteTicketHandler,
  changeTicketStatusHandler,
  assignTicketHandler,
  addTicketAttachmentHandler,
  getTicketsByDepartmentHandler,
  getMyTicketsHandler,
  getAssignedTicketsHandler,
  getAllTicketsHandler,
  getTicketByIdHandler,
  getDepartmentSolversHandler,
  ticketCommandController,
  ticketQueryController,
  userQueryController,
  getAllDepartmentsQuery,
  loginHandler,
  createUserHandler
};
