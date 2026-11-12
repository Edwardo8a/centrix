/**
 * @typedef {Object} ITicketRepository
 * @property {(ticketData: import('../models/Ticket')) => Promise<{id: string}>} create
 * @property {(id: string) => Promise<object|null>} findById
 * @property {(ticketId: string, userId: string) => Promise<object|void>} softDelete
 * @property {(params: { ticketId: string, userId: string, newStatus: string, previousStatus: string, comment?: string|null }) => Promise<{id: string, previousStatus: string, status: string}>} updateStatus
 * @property {(params: { ticketId: string, assignedTo: string, userId: string, comment: string }) => Promise<{id: string}>} assign
 * @property {(params: { ticketId: string, fileUrl: string, fileFormat: string, sizeBytes: number }) => Promise<{id: string}>} addAttachment
 */

/**
 * @typedef {Object} ITicketReadModel
 * @property {(departmentId: string) => Promise<Array<object>>} getTicketsByDepartment
 * @property {(userId: string) => Promise<Array<object>>} getTicketsByCreator
 * @property {(userId: string) => Promise<Array<object>>} getTicketsByAssignee
 * @property {(params: { status?: string|null, departmentId?: string|null, priority?: string|null, page?: number, limit?: number }) => Promise<{ items: Array<object>, pagination: { total: number, page: number, limit: number, totalPages: number } }>} getAllTickets
 * @property {(ticketId: string) => Promise<object|null>} getTicketById
 * @property {(ticketId: string) => Promise<Array<{ id: string, fileFormat: string, sizeBytes: number, createdAtIso: string, signedUrl: string|null }>>} getAttachmentsWithSignedUrls
 */

/**
 * @typedef {Object} IDepartmentReadModel
 * @property {() => Promise<Array<object>>} getAll
 */

/**
 * @typedef {Object} IUserRepository
 * @property {(userData: object, authId: string) => Promise<object>} create
 * @property {(id: string) => Promise<object|null>} findById
 * @property {(userId: string, data: object) => Promise<object|null>} update
 * @property {(userId: string) => Promise<object|null>} softDelete
 */

/**
 * @typedef {Object} IUserReadModel
 * @property {(id: string) => Promise<{id: string, nombre: string, apellido_pat?: string, apellido_mat?: string, tel?: string, department_id: string|null, role: string, roles: string[]}|null>} findById
 * @property {(departmentId: string) => Promise<Array<{id: string, fullName: string}>>} getSolversByDepartment
 * @property {(params: { role?: string|null, departmentId?: string|null, search?: string|null, page?: number, limit?: number }) => Promise<{ items: Array<object>, pagination: { total: number, page: number, limit: number, totalPages: number } }>} getAllUsers
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

/**
 * @typedef {Object} IStorageService
 * @property {(rawAttachments: Array<object>) => Promise<Array<{ id: string, fileFormat: string, sizeBytes: number, createdAtIso: string, signedUrl: string|null }>>} createSignedUrlsForAttachments
 */

/**
 * @typedef {Object} IGetAllDepartmentsHandler
 * @property {() => Promise<Array<object>>} handle
 */

/**
 * @typedef {Object} IResourceRequestRepository
 * @property {(data: import('../models/ResourceRequest')) => Promise<{id: string}>} create
 * @property {(id: string) => Promise<object|null>} findById
 * @property {(requestId: string, userId: string) => Promise<object|null>} softDelete
 */

/**
 * @typedef {Object} IResourceRequestReadModel
 * @property {(userId: string) => Promise<Array<object>>} getRequestsByCreator
 * @property {(departmentId: string, filters?: { status?: string, page?: number, limit?: number }) => Promise<{ items: Array<object>, pagination: { total: number, page: number, limit: number, totalPages: number } }>} getRequestsByDepartment
 * @property {(requestId: string) => Promise<object|null>} getRequestById
 */

module.exports = {};
