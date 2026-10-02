# Centrix Backend API

[![CI Pipeline](https://github.com/Edwardo8a/centrix/actions/workflows/ci.yml/badge.svg)](https://github.com/Edwardo8a/centrix/actions/workflows/ci.yml)
![Node Version](https://img.shields.io/badge/Node.js-v22-green.svg)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)
![Architecture](https://img.shields.io/badge/Architecture-CQRS-orange.svg)
![Testing](https://img.shields.io/badge/Testing-Jest-red.svg)
![Linter](https://img.shields.io/badge/Linter-ESLint%209-purple.svg)

Backend para el **Sistema de Gestion V2 (Centrix)** desarrollado con **Node.js**, **Express**, **Supabase** (PostgreSQL) e implementado bajo una arquitectura desacoplada con el patron **CQRS (Command Query Responsibility Segregation)**.

---

## Tabla de Contenidos
1. [Caracteristicas Principales](#caracteristicas-principales)
2. [Arquitectura del Sistema (CQRS)](#arquitectura-del-sistema-cqrs)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Configuracion del Entorno](#configuracion-del-entorno)
5. [Scripts Disponibles](#scripts-disponibles)
6. [Estrategia de Pruebas y Linter](#estrategia-de-pruebas-y-linter)
7. [Endpoints Principales API](#endpoints-principales-api)
8. [Documentacion Tecnica](#documentacion-tecnica)

---

## Caracteristicas Principales

- **Arquitectura CQRS Directa**: Separacion total entre logica de escritura (Commands) y consultas de lectura (Queries).
- **Control de Calidad (ESLint 9 + Jest)**: Linter estandar y suite de pruebas unitarias automatizadas.
- **Seguridad y Middlewares**: Autenticacion mediante **JWT**, control de acceso por roles (**RBAC** con `UserRole`), sanitizacion mediante `express-validator` y proteccion con `helmet` y `cors`.
- **Persistencia con Supabase**: Integracion oficial con `@supabase/supabase-js` con soporte para RPC y repositorios.
- **CI/CD Automatizado**: Integracion Continua en GitHub Actions para validar linting y pruebas en cada PR o Push.

---

## Arquitectura del Sistema (CQRS)

El sistema aplica **Command Query Responsibility Segregation**:

```text
               +-------------------------------------------------------+
               |                  HTTP Requests (API)                  |
               +---------------------------+---------------------------+
                                           |
               +---------------------------+---------------------------+
               |                                                       |
     [COMMANDS / ESCRITURA]                                  [QUERIES / LECTURA]
               |                                                       |
               v                                                       v
   +-----------------------+                               +-----------------------+
   |  Command Controllers  |                               |   Query Controllers   |
   +-----------+-----------+                               +-----------+-----------+
               |                                                       |
               v                                                       v
   +-----------------------+                               +-----------------------+
   |   Command Handlers    |                               |    Query Handlers     |
   |   (Reglas Negocio)    |                               |   (Lectura Directa)   |
   +-----------+-----------+                               +-----------+-----------+
               |                                                       |
               v                                                       v
   +-----------------------+                               +-----------------------+
   |   TicketRepository    |                               |    TicketReadModel    |
   |   UserRepository      |                               |  DepartmentRepository |
   +-----------+-----------+                               +-----------+-----------+
               |                                                       |
               +---------------------------+---------------------------+
                                           |
                                           v
                              +-------------------------+
                              |   Supabase PostgreSQL   |
                              +-------------------------+
```

---

## Estructura del Proyecto

Consulta [`ESTRUCTURA_PROYECTO.md`](./ESTRUCTURA_PROYECTO.md) para conocer el arbol completo de directorios y la descripcion de cada modulo.

---

## Configuracion del Entorno

1. Clona el repositorio e instala las dependencias:
   ```bash
   git clone https://github.com/Edwardo8a/centrix.git
   cd centrix
   npm install
   ```

2. Configura las variables de entorno en un archivo `.env`:
   ```env
   PORT=3001
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-anon-key
   JWT_SECRET=tu-secreto-jwt
   JWT_EXPIRES_IN=24h
   ```

---

## Scripts Disponibles

- `npm start`: Inicia el servidor en modo produccion.
- `npm run dev`: Inicia el servidor con recarga automatica (`nodemon`).
- `npm test`: Ejecuta las pruebas unitarias con Jest.
- `npm run lint`: Ejecuta el linter ESLint.

---

## Endpoints Principales API

### Autenticacion (`/api/auth`)
| Metodo | Endpoint | Descripcion | Acceso |
|---|---|---|---|
| `POST` | `/api/auth/login` | Inicia sesion y devuelve JWT | Publico |

### Incidencias / Tickets (`/api/tickets`)
| Metodo | Endpoint | Descripcion | Acceso |
|---|---|---|---|
| `POST` | `/api/tickets` | Crea un nuevo ticket (HU-03) | Colaborador, Gerente, Admin |
| `PATCH` | `/api/tickets/:id/status` | Cambia el estado a En revision (HU-05) | Gerente, Admin, Soporte |
| `POST` | `/api/tickets/:id/assign` | Asigna un ticket a un responsable | Gerente, Admin |
| `GET` | `/api/tickets/my-tickets` | Obtiene tickets del usuario autenticado | Autenticado |
| `GET` | `/api/tickets/pending` | Obtiene tickets en cola de atencion | Gerente, Admin |
| `GET` | `/api/tickets/department/:id` | Obtiene tickets por departamento | Gerente, Admin |
| `GET` | `/api/tickets/:id` | Detalle completo de un ticket | Autenticado |

### Departamentos (`/api/departments`)
| Metodo | Endpoint | Descripcion | Acceso |
|---|---|---|---|
| `GET` | `/api/departments` | Catalogo de departamentos (HU-13) | Autenticado |

### Administracion (`/api/admin`)
| Metodo | Endpoint | Descripcion | Acceso |
|---|---|---|---|
| `POST` | `/api/admin/users` | Crea un nuevo usuario en Auth y BD (HU-11) | Admin |
| `PUT` | `/api/admin/users/:userId/roles` | Asigna multiples roles a un usuario (PPS-42) | Admin |

---

## Documentacion Tecnica

Para mas detalles, consulta la carpeta [`docs/`](./docs/README.md):
- **Guias de Conexion para Frontend:** `docs/conexion-apis/`
- **Flujos HTTP paso a paso:** `docs/flujos-http/`
- **Arquitectura CQRS por modulo:** `docs/cqrs/`
- **Principios SOLID explicados:** `docs/solid/`
