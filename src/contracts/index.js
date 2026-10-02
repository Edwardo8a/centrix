/**
 * @typedef {Object} ITicketRepository
 * @property {(ticketData: import('../models/Ticket')) => Promise<{id: string}>} create
 */

/**
 * @typedef {Object} ITicketReadModel
 * @property {(departmentId: string) => Promise<Array<object>>} getTicketsByDepartment
 */

/**
 * @typedef {Object} IDepartmentReadModel
 * @property {() => Promise<Array<object>>} getAll
 */

/**
 * @typedef {Object} IUserRepository
 * @property {(userData: object, authId: string) => Promise<object>} create
 */

/**
 * @typedef {Object} IUserReadModel
 * @property {(id: string) => Promise<object|null>} findById
 */

/**
 * @typedef {Object} IAuthService
 * @property {(email: string, password: string) => Promise<{authId: string}>} signIn
 * @property {(email: string, password: string) => Promise<{authId: string}>} signUp
 * @property {(authId: string) => Promise<void>} deleteUser
 */

/**
 * @typedef {Object} ITokenService
 * @property {(payload: object) => string} generateToken
 */

module.exports = {};
