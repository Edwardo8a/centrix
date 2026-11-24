const { dataClient, authClient, adminClient } = require('./supabaseClient');

// Repositories & Services
const TicketRepository = require('../repositories/TicketRepository');
const TicketReadModel = require('../repositories/TicketReadModel');
const DepartmentReadModel = require('../repositories/DepartmentReadModel');
const DepartmentRepository = require('../repositories/DepartmentRepository');
const UserRepository = require('../repositories/UserRepository');
const UserReadModel = require('../repositories/UserReadModel');
const ResourceRequestRepository = require('../repositories/ResourceRequestRepository');
const ResourceRequestReadModel = require('../repositories/ResourceRequestReadModel');
const StorageService = require('../services/StorageService');
const AuthService = require('../services/AuthService');
const TokenService = require('../services/TokenService');
const jwtConfig = require('./jwt');

const storageService = new StorageService({
  storageClient: adminClient || dataClient
});

const ticketRepository = new TicketRepository({ supabase: adminClient || dataClient });
const ticketReadModel = new TicketReadModel({
  supabase: adminClient || dataClient,
  storageService
});
const departmentReadModel = new DepartmentReadModel({ supabase: dataClient });
const departmentRepository = new DepartmentRepository({ supabase: adminClient || dataClient });
const userRepository = new UserRepository({ supabase: adminClient || dataClient });
const userReadModel = new UserReadModel({ supabase: dataClient });
const resourceRequestRepository = new ResourceRequestRepository({ supabase: adminClient || dataClient });
const resourceRequestReadModel = new ResourceRequestReadModel({ supabase: adminClient || dataClient });

const EvidenceRepository = require('../repositories/EvidenceRepository');
const FileStorageService = require('../services/FileStorageService');
const TicketEvidenceAccessPolicy = require('../services/TicketEvidenceAccessPolicy');
const AttachTicketEvidenceHandler = require('../commands/tickets/AttachTicketEvidenceHandler');
const GetTicketEvidencesQuery = require('../queries/tickets/GetTicketEvidencesQuery');
const GetPendingTicketsHandler = require('../queries/tickets/GetPendingTicketsHandler');

const evidenceDependencies = {
  ticketRepository,
  evidenceRepository: new EvidenceRepository({ supabase: adminClient || dataClient }),
  fileStorageService: new FileStorageService({ supabase: adminClient || dataClient }),
  accessPolicy: new TicketEvidenceAccessPolicy()
};
const attachTicketEvidenceHandler = new AttachTicketEvidenceHandler(evidenceDependencies);
const getTicketEvidencesQuery = new GetTicketEvidencesQuery(evidenceDependencies);
const getPendingTicketsHandler = new GetPendingTicketsHandler({ ticketReadModel });

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
const GetAllDepartmentsHandler = require('../queries/departments/GetAllDepartmentsHandler');
const CreateDepartmentHandler = require('../commands/departments/CreateDepartmentHandler');
const GetAllDepartmentsQuery = require('../queries/departments/GetAllDepartmentsQuery');
const LoginHandler = require('../commands/auth/LoginHandler');
const CreateUserHandler = require('../commands/admin/CreateUserHandler');
const GetAllUsersHandler = require('../queries/users/GetAllUsersHandler');
const UpdateUserHandler = require('../commands/users/UpdateUserHandler');
const DeleteUserHandler = require('../commands/users/DeleteUserHandler');
const CreateResourceRequestHandler = require('../commands/resource-requests/CreateResourceRequestHandler');
const DeleteResourceRequestHandler = require('../commands/resource-requests/DeleteResourceRequestHandler');
const GetMyResourceRequestsHandler = require('../queries/resource-requests/GetMyResourceRequestsHandler');
const GetResourceRequestsByDepartmentHandler = require('../queries/resource-requests/GetResourceRequestsByDepartmentHandler');
const GetResourceRequestByIdHandler = require('../queries/resource-requests/GetResourceRequestByIdHandler');

const createTicketHandler = new CreateTicketHandler({ ticketRepository });
const deleteTicketHandler = new DeleteTicketHandler({ ticketRepository });
const changeTicketStatusHandler = new ChangeTicketStatusHandler({ ticketRepository });
const assignTicketHandler = new AssignTicketHandler({ ticketRepository, userReadModel });
const addTicketAttachmentHandler = new AddTicketAttachmentHandler({ ticketRepository });
const getTicketsByDepartmentHandler = new GetTicketsByDepartmentHandler({ ticketReadModel });
const getMyTicketsHandler = new GetMyTicketsHandler({ ticketReadModel });
const getAllUsersHandler = new GetAllUsersHandler({ userReadModel });
const getAssignedTicketsHandler = new GetAssignedTicketsHandler({ ticketReadModel });
const getAllTicketsHandler = new GetAllTicketsHandler({ ticketReadModel });
const getTicketByIdHandler = new GetTicketByIdHandler({ ticketReadModel });
const getDepartmentSolversHandler = new GetDepartmentSolversHandler({ userReadModel });
const getAllDepartmentsHandler = new GetAllDepartmentsHandler({ departmentReadModel });
const createDepartmentHandler = new CreateDepartmentHandler({ departmentRepository });
const getAllDepartmentsQuery = new GetAllDepartmentsQuery({ departmentReadModel });
const loginHandler = new LoginHandler({ authService, userReadModel, tokenService });
const createUserHandler = new CreateUserHandler({ authService, userRepository });
const updateUserHandler = new UpdateUserHandler({ userRepository });
const deleteUserHandler = new DeleteUserHandler({ userRepository });
const createResourceRequestHandler = new CreateResourceRequestHandler({ resourceRequestRepository });
const deleteResourceRequestHandler = new DeleteResourceRequestHandler({ resourceRequestRepository });
const getMyResourceRequestsHandler = new GetMyResourceRequestsHandler({ resourceRequestReadModel });
const getResourceRequestsByDepartmentHandler = new GetResourceRequestsByDepartmentHandler({ resourceRequestReadModel });
const getResourceRequestByIdHandler = new GetResourceRequestByIdHandler({ resourceRequestReadModel });

// Controllers (Factories inyectadas en el contenedor)
const ticketCommandControllerFactory = require('../controllers/TicketCommandController');
const ticketQueryControllerFactory = require('../controllers/TicketQueryController');
const userQueryControllerFactory = require('../controllers/UserQueryController');
const adminControllerFactory = require('../controllers/AdminController');
const authControllerFactory = require('../controllers/AuthController');
const departmentQueryControllerFactory = require('../controllers/DepartmentQueryController');
const departmentCommandControllerFactory = require('../controllers/DepartmentCommandController');
const resourceRequestCommandControllerFactory = require('../controllers/ResourceRequestCommandController');
const resourceRequestQueryControllerFactory = require('../controllers/ResourceRequestQueryController');

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
  getDepartmentSolversHandler,
  getAllUsersHandler
});

const adminController = adminControllerFactory({
  userRepository,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler
});

const authController = authControllerFactory({
  loginHandler
});

const departmentQueryController = departmentQueryControllerFactory({
  getAllDepartmentsHandler
});
const departmentCommandController = departmentCommandControllerFactory({ createDepartmentHandler });

const resourceRequestCommandController = resourceRequestCommandControllerFactory({
  createResourceRequestHandler,
  deleteResourceRequestHandler
});

const resourceRequestQueryController = resourceRequestQueryControllerFactory({
  getMyResourceRequestsHandler,
  getResourceRequestsByDepartmentHandler,
  getResourceRequestByIdHandler
});

module.exports = {
  attachTicketEvidenceHandler,
  getTicketEvidencesQuery,
  getPendingTicketsHandler,
  storageService,
  userReadModel,
  ticketRepository,
  ticketReadModel,
  departmentReadModel,
  userRepository,
  authService,
  tokenService,
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
  getAllDepartmentsHandler,
  getAllDepartmentsQuery,
  loginHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  ticketCommandController,
  ticketQueryController,
  getAllUsersHandler,
  userQueryController,
  adminController,
  authController,
  departmentQueryController,
  departmentCommandController,
  resourceRequestRepository,
  resourceRequestReadModel,
  createResourceRequestHandler,
  deleteResourceRequestHandler,
  getMyResourceRequestsHandler,
  getResourceRequestsByDepartmentHandler,
  getResourceRequestByIdHandler,
  resourceRequestCommandController,
  resourceRequestQueryController
};
