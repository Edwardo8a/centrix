# Centrix Backend API

Backend para el Sistema de Gestión V2 desarrollado con **Node.js**, **Express**, **TypeScript** y **Supabase**, estructurado bajo una arquitectura de software por capas y el patrón **CQRS (Command Query Responsibility Segregation)**.

---

## 🏛️ Arquitectura CQRS & Estructura por Capas

El backend separa estrictamente las operaciones de mutación/escritura (**Commands**) de las operaciones de consulta/lectura (**Queries / Read Models**):

```text
src/
├── core/                   # Capa de Dominio (Entidades, Enums, Contratos e Interfaces)
│   ├── contracts/          # Interfaces de Repositorios (IRepositories.ts) y Read Models (IReadModels.ts)
│   ├── entities/           # Entidades de dominio (User, Ticket, Expense, Approval)
│   └── enums/              # Enum de roles y estados
├── application/            # Capa de Aplicación (Casos de Uso CQRS)
│   ├── commands/           # Comandos de Escritura (CreateTicketCommand, AssignTicketCommand, etc.)
│   └── queries/            # Consultas de Lectura (GetTicketsByUserQuery, GetPendingExpensesQuery, etc.)
├── infrastructure/         # Capa de Infraestructura
│   ├── db/                 # Cliente Supabase y Migraciones SQL
│   ├── repositories/       # Repositorios de Escritura (TicketRepository, ExpenseRepository, etc.)
│   ├── read_models/        # Modelos de Lectura Proyectados para ViewModels
│   └── services/           # Servicios externos (AuditService, NotificationService, FileStorageService)
├── interfaces/             # Capa de Entrada / HTTP API
│   ├── controllers/        # Controladores CQRS (TicketCommandController vs TicketQueryController)
│   ├── middlewares/        # Autenticación, Roles, Subida de archivos y Handler de Errores
│   ├── routes/             # Enrutadores Express (authRoutes, ticketRoutes, expenseRoutes, adminRoutes)
│   └── validators/         # Validadores express-validator
└── utils/                  # Utilidades globales (ResponseBuilder, Logger)
```

---

## 🛠️ Scripts Disponibles

```bash
# Desarrollo con recarga automática
npm run dev

# Verificación de tipos TypeScript
npm run type-check

# Compilación TypeScript
npm run build

# Iniciar servidor en producción
npm start
```

---

## 🚀 DevOps, Gitflow & Reglas de Pull Request

Este repositorio sigue convenciones estrictas de Git, estrategia de ramas y plantillas de Pull Request:

- 📜 **Guía Completa de Gitflow**: Ver [GITFLOW_GUIDELINES.md](GITFLOW_GUIDELINES.md).
- 🔀 **Estructura de Ramas**: `main` (Producción), `dev` (Integración), `sprint` (Iteración activa), `feature/*`, `bugfix/*`, `hotfix/*`.
- 💬 **Mensajes de Commit**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`).
- 📋 **Plantilla de Pull Request**: [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
- ⚡ **Integración Continua**: GitHub Actions [.github/workflows/ci.yml](.github/workflows/ci.yml).
