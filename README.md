# Centrix Backend API 🚀

[![CI Pipeline](https://github.com/Edwardo8a/centrix/actions/workflows/ci.yml/badge.svg)](https://github.com/Edwardo8a/centrix/actions/workflows/ci.yml)
![Node Version](https://img.shields.io/badge/Node.js-v24.20.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)
![Architecture](https://img.shields.io/badge/Architecture-CQRS%20%2B%20Layered-orange.svg)
![Testing](https://img.shields.io/badge/Testing-Jest-red.svg)
![Linter](https://img.shields.io/badge/Linter-ESLint%209-purple.svg)

Backend de grado de producción para el **Sistema de Gestión V2 (Centrix)** desarrollado con **Node.js**, **Express**, **TypeScript**, **Supabase** (PostgreSQL) e implementado bajo una arquitectura limpia por capas desacoplada con el patrón **CQRS (Command Query Responsibility Segregation)**.

---

## 📋 Tabla de Contenidos
1. [Características Principales](#-características-principales)
2. [Arquitectura del Sistema (CQRS + Layered)](#-arquitectura-del-sistema-cqrs--layered)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Configuración del Entorno](#-configuración-del-entorno)
5. [Scripts Disponibles](#-scripts-disponibles)
6. [Estrategia de Pruebas y Linter](#-estrategia-de-pruebas-y-linter)
7. [Convenciones DevOps & Gitflow](#-convenciones-devops--gitflow)
8. [Endpoints Principales API](#-endpoints-principales-api)

---

## ⚡ Características Principales

- **Arquitectura CQRS Estricta**: Separación total entre la lógica de escritura (mutaciones/Commands) y lectura (proyecciones/Queries).
- **TypeScript Nativo & Tipado Estricto**: Configuración moderna con `tsconfig.json` (`Node16` resolution).
- **Control de Calidad (ESLint 9 + Jest)**: Linter de Flat Config y suite de pruebas unitarias integradas.
- **Seguridad & Middleware Robustos**: Autenticación mediante **JWT**, control de acceso por roles (**RBAC** con `UserRole`), sanitización mediante `express-validator` y protección con `helmet` y `cors`.
- **Persistencia ACID & Supabase**: Soporte para funciones almacenadas (RPC) con fallback a repositorios de dominio.
- **CI/CD Automatizado**: Integración Continua en GitHub Actions para validar compilación, tipos, linting y pruebas en cada PR o Push.

---

## 🏛️ Arquitectura del Sistema (CQRS + Layered)

El sistema aplica **Command Query Responsibility Segregation**:

```text
               ┌────────────────────────────────────────────────────────┐
               │                    HTTP Requests (API)                 │
               └───────────┬────────────────────────────────┬───────────┘
                           │                                │
                 [COMMANDS / WRITES]               [QUERIES / READS]
                           │                                │
                           ▼                                ▼
               ┌──────────────────────┐         ┌──────────────────────┐
               │ Command Controllers  │         │  Query Controllers   │
               └───────────┬──────────┘         └───────────┬──────────┘
                           │                                │
                           ▼                                ▼
               ┌──────────────────────┐         ┌──────────────────────┐
               │    Command Handlers  │         │    Query Handlers    │
               │ (Business Rules/ACID)│         │ (ViewModel DTOs)     │
               └───────────┬──────────┘         └───────────┬──────────┘
                           │                                │
                           ▼                                ▼
               ┌──────────────────────┐         ┌──────────────────────┐
               │  Write Repositories  │         │     Read Models      │
               └───────────┬──────────┘         └───────────┬──────────┘
                           │                                │
                           └───────────────┬────────────────┘
                                           ▼
                                 ┌──────────────────┐
                                 │   Supabase DB    │
                                 └──────────────────┘
```

---

## 📁 Estructura del Proyecto

```text
.
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md    # Plantilla oficial de Pull Requests para GitHub
│   └── workflows/
│       └── ci.yml                  # Pipeline CI (Type-Check, Lint, Tests)
├── src/
│   ├── __tests__/                  # Pruebas unitarias de Jest
│   │   └── app.test.js
│   ├── application/                # Capa de Aplicación (Casos de Uso CQRS)
│   │   ├── commands/               # Comandos de Escritura (CreateTicketCommand, etc.)
│   │   └── queries/                # Consultas de Lectura (GetTicketsByUserQuery, etc.)
│   ├── config/                     # Configuraciones (Database, JWT, Multer)
│   ├── core/                       # Capa de Dominio (Entidades, Enums, Excepciones, Contratos)
│   │   ├── contracts/              # Interfaces de Repositorios e Interfaces de ReadModels
│   │   ├── entities/               # User, Ticket, Expense, Approval
│   │   ├── enums/                  # UserRole, TicketStatus, TicketCategory, ExpenseStatus
│   │   └── exceptions/             # BusinessError, ValidationError
│   ├── infrastructure/             # Capa de Infraestructura
│   │   ├── db/                     # Cliente Supabase & Migraciones SQL
│   │   ├── read_models/            # Proyecciones DTO optimizadas para ViewModels (Flutter/Web)
│   │   ├── repositories/           # Repositorios de Escritura
│   │   └── services/               # AuditService, NotificationService, FileStorageService
│   ├── interfaces/                 # Capa de Entrada / HTTP API
│   │   ├── controllers/            # Controladores separados en Command y Query
│   │   ├── middlewares/            # Auth, RoleCheck, Upload, ErrorHandler
│   │   ├── routes/                 # Rutas Express (/api/auth, /api/tickets, /api/expenses, /api/admin)
│   │   └── validators/             # Validaciones express-validator
│   ├── utils/                      # ResponseBuilder, Logger, ValidatorHelpers
│   └── app.js                      # Configuración principal de Express
├── eslint.config.js                # Configuración Flat Config de ESLint 9+
├── GITFLOW_GUIDELINES.md           # Guía oficial de Convenciones Git y Flujo de Trabajo
├── package.json                    # Dependencias y Scripts de npm
├── server.js                       # Punto de entrada del servidor Node.js
└── tsconfig.json                   # Configuración estricta de compilador TypeScript
```

---

## 🔧 Configuración del Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
PORT=3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-de-supabase
JWT_SECRET=tu-secreto-para-firmar-jwt-tokens
JWT_EXPIRES_IN=24h
```

---

## 🛠️ Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Ejecuta el servidor en modo desarrollo con `nodemon`. |
| `npm run dev:ts` | Ejecuta el servidor TypeScript en modo desarrollo con `tsx watch`. |
| `npm run type-check` | Ejecuta la comprobación estricta de tipos con `tsc --noEmit`. |
| `npm run lint` | Analiza y valida el código con `eslint .`. |
| `npm test` | Ejecuta la suite de pruebas unitarias con `jest`. |
| `npm run build` | Compila el código TypeScript a JavaScript en la carpeta `./dist`. |
| `npm start` | Inicia el servidor en producción con `node server.js`. |

---

## 🧪 Estrategia de Pruebas y Linter

- **Linter (ESLint 9+)**: Reglas configuradas en `eslint.config.js`. Puedes verificar la calidad del código ejecutando:
  ```bash
  npm run lint
  ```
- **Pruebas (Jest)**: Ubicadas en `src/__tests__/`. Para ejecutar la suite completa:
  ```bash
  npm test
  ```

---

## 🚀 Convenciones DevOps & Gitflow

El repositorio sigue un modelo de flujo de trabajo riguroso:

- 📜 **Guía Completa de Gitflow**: Ver [GITFLOW_GUIDELINES.md](GITFLOW_GUIDELINES.md).
- 🔀 **Estructura de Ramas**:
  - `main`: Producción estable y lista para despliegue.
  - `dev`: Rama de integración principal de desarrollo.
  - `sprint`: Rama de integración del sprint activo.
  - `feature/*`, `bugfix/*`, `hotfix/*`: Ramas temporales de trabajo.
- 💬 **Mensajes de Commit (Conventional Commits)**:
  - Formato: `tipo(alcance): descripción breve` (ej. `feat(tickets): add AssignTicketCommand persistence`).
- 📋 **Plantilla de Pull Request**: [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
- ⚡ **Pipeline CI**: [.github/workflows/ci.yml](.github/workflows/ci.yml) (Valida automatizadamente Type-check, Lint, Jest y arranque en Node 22).

---

## 📡 Endpoints Principales API

| Método | Ruta | Descripción | Rol Requerido | Tipo CQRS |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de estado del servidor | Público | Query |
| `POST` | `/api/auth/login` | Inicio de sesión y generación de JWT | Público | Command |
| `GET` | `/api/tickets/my-tickets` | Obtener tickets del usuario (ViewModel) | Autenticado | Query |
| `GET` | `/api/tickets/pending` | Obtener tickets pendientes | Gerente / Admin | Query |
| `POST` | `/api/tickets` | Crear un nuevo ticket | Colaborador / Gerente / Admin | Command |
| `PATCH` | `/api/tickets/:ticketId/status` | Actualizar estado de ticket | Gerente / Admin | Command |
| `POST` | `/api/tickets/:ticketId/assign` | Asignar ticket a un usuario | Gerente / Admin | Command |
| `GET` | `/api/expenses/my-expenses` | Obtener gastos del usuario (ViewModel) | Autenticado | Query |
| `POST` | `/api/expenses` | Registrar nuevo gasto | Colaborador / Gerente / Admin | Command |
| `PATCH` | `/api/expenses/:expenseId/status` | Aprobar/Rechazar estado de gasto | Gerente / Admin | Command |
| `GET` | `/api/admin/reports` | Obtener métricas y reportes globales | Admin | Query |
| `GET` | `/api/admin/audit-logs` | Consultar logs de auditoría del sistema | Admin | Query |

---

## 📄 Licencia
Este proyecto es privado y confidencial para el **Sistema de Gestión V2 (Centrix)**.
