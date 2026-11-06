# Centrix Backend API

[![CI Pipeline](https://github.com/Edwardo8a/centrix/actions/workflows/ci.yml/badge.svg)](https://github.com/Edwardo8a/centrix/actions/workflows/ci.yml)
![Node Version](https://img.shields.io/badge/Node.js-v22-green.svg)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)
![Architecture](https://img.shields.io/badge/Architecture-CQRS%20%2B%20SOLID-orange.svg)
![Testing](https://img.shields.io/badge/Testing-Jest-red.svg)
![Linter](https://img.shields.io/badge/Linter-ESLint%209-purple.svg)

Backend para el **Sistema de Gestion V2 (Centrix)** desarrollado con **Node.js**, **Express**, **Supabase** (PostgreSQL) e implementado bajo una arquitectura desacoplada con el patron **CQRS (Command Query Responsibility Segregation)**, principios **SOLID** y un contenedor central de **Inyeccion de Dependencias**.

---

## Tabla de Contenidos
1. [Caracteristicas Principales](#caracteristicas-principales)
2. [Arquitectura del Sistema (CQRS + SOLID)](#arquitectura-del-sistema-cqrs--solid)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Configuracion del Entorno](#configuracion-del-entorno)
5. [Scripts Disponibles](#scripts-disponibles)
6. [Estrategia de Pruebas y Calidad](#estrategia-de-pruebas-y-calidad)
7. [Endpoints Principales API](#endpoints-principales-api)
8. [Documentacion Tecnica Modular](#documentacion-tecnica-modular)

---

## Caracteristicas Principales

- **Arquitectura CQRS Estricta**: Separacion total entre la logica de mutacion (Commands y Handlers) y la logica de consulta directa (Queries y ReadModels).
- **Inyeccion de Dependencias (Composition Root)**: Todo el grafo de dependencias se ensambla en `src/config/container.js`.
- **Segregacion de Interfaces y Contratos**: Separacion entre repositorios de escritura (`UserRepository`, `TicketRepository`) y modelos de lectura (`UserReadModel`, `TicketReadModel`, `DepartmentReadModel`) con contratos tipados en `src/contracts/index.js`.
- **Servicios Aislados**: Extraccion de la comunicacion con Supabase Auth en `AuthService` y la firma de tokens en `TokenService`.
- **Control de Calidad**: 100% de pruebas unitarias automatizadas con Jest y linteo con ESLint 9.
- **Seguridad**: Autenticacion con JWT, control de acceso basado en roles (`UserRole`), sanitizacion con `express-validator` y cabeceras de proteccion con `helmet` y `cors`.

---

## Arquitectura del Sistema (CQRS + SOLID)

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
   |   (Casos de Uso)      |                               |   (Lectura Directa)   |
   +-----------+-----------+                               +-----------+-----------+
               |                                                       |
               v                                                       v
   +-----------------------+                               +-----------------------+
   |   TicketRepository    |                               |    TicketReadModel    |
   |   UserRepository      |                               |  DepartmentReadModel  |
   |   AuthService         |                               |    UserReadModel      |
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
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   JWT_SECRET=tu-secreto-jwt
   JWT_EXPIRES_IN=24h
   ```

---

## Scripts Disponibles

- `npm start`: Inicia el servidor en modo produccion.
- `npm run dev`: Inicia el servidor con recarga automatica (`nodemon`).
- `npm test`: Ejecuta las pruebas unitarias automatizadas con Jest.
- `npm run lint`: Ejecuta el linter ESLint.

---

## Estrategia de Pruebas y Calidad

El proyecto cuenta con suites de pruebas unitarias que cubren los Handlers de escritura y los Queries de lectura utilizando mocks de sus dependencias:
- `CreateTicketHandler.test.js`
- `CreateUserHandler.test.js`
- `LoginHandler.test.js`
- `GetTicketsByDepartmentQuery.test.js`
- `GetAllDepartmentsQuery.test.js`
- `app.test.js`

Ejecucion:
```bash
npm test
```

---

## Endpoints Principales API

### Autenticacion (`/api/auth`)
| Metodo | Endpoint | Descripcion | Acceso |
|---|---|---|---|
| `POST` | `/api/auth/login` | Inicia sesion y devuelve JWT con roles | Publico |

### Incidencias / Tickets (`/api/tickets`)
| Metodo | Endpoint | Descripcion | Acceso |
|---|---|---|---|
| `POST` | `/api/tickets` | Crea un nuevo ticket (HU-03) | Colaborador, Gerente, Admin |
| `GET` | `/api/tickets/department/:departmentId` | Obtiene tickets por departamento | Gerente, Admin |

### Departamentos (`/api/departments`)
| Metodo | Endpoint | Descripcion | Acceso |
|---|---|---|---|
| `GET` | `/api/departments` | Catalogo de departamentos (HU-13) | Autenticado |

### Administracion (`/api/admin`)
| Metodo | Endpoint | Descripcion | Acceso |
|---|---|---|---|
| `POST` | `/api/admin/users` | Crea un nuevo usuario en Auth y BD (HU-11) | Admin |

---

## Documentacion Tecnica Modular

Para mas detalles, consulta la carpeta [`docs/`](./docs/README.md):
- **Evaluacion SOLID:** [`docs/SOLID.md`](./docs/SOLID.md)
- **Guias de Conexion para Frontend:** `docs/conexion-apis/`
- **Flujos HTTP paso a paso:** `docs/flujos-http/`
- **Arquitectura CQRS explicada:** `docs/cqrs/`
- **Principios SOLID explicados por modulo:** `docs/solid/`
