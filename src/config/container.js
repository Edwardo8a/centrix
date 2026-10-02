const { dataClient, authClient, adminClient } = require('./supabaseClient');

// Repositories
const TicketRepository = require('../repositories/TicketRepository');
const TicketReadModel = require('../repositories/TicketReadModel');
const DepartmentReadModel = require('../repositories/DepartmentReadModel');
const UserRepository = require('../repositories/UserRepository');
const UserReadModel = require('../repositories/UserReadModel');

const ticketRepository = new TicketRepository({ supabase: dataClient });
const ticketReadModel = new TicketReadModel({ supabase: dataClient });
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
const GetTicketsByDepartmentQuery = require('../queries/tickets/GetTicketsByDepartmentQuery');
const GetAllDepartmentsQuery = require('../queries/departments/GetAllDepartmentsQuery');
const LoginHandler = require('../commands/auth/LoginHandler');
const CreateUserHandler = require('../commands/admin/CreateUserHandler');

const createTicketHandler = new CreateTicketHandler({ ticketRepository });
const getTicketsByDepartmentQuery = new GetTicketsByDepartmentQuery({ ticketReadModel });
const getAllDepartmentsQuery = new GetAllDepartmentsQuery({ departmentReadModel });
const loginHandler = new LoginHandler({ authService, userReadModel, tokenService });
const createUserHandler = new CreateUserHandler({ authService, userRepository });

module.exports = {
  createTicketHandler,
  getTicketsByDepartmentQuery,
  getAllDepartmentsQuery,
  loginHandler,
  createUserHandler
};
