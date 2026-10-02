# Cumplimiento de Principios SOLID

Esta es una evaluación honesta de cómo el proyecto cumple con los principios SOLID tras la refactorización arquitectónica basada en CQRS.

| Principio | Aplicación en el Proyecto (Archivos concretos) | Limitaciones / Pendientes |
|-----------|------------------------------------------------|---------------------------|
| **S** - Responsabilidad Única | **Controladores** (`src/controllers/*`): Solo extraen datos de HTTP y devuelven respuestas HTTP.<br>**Commands/Queries** (`src/commands/*`): Son DTOs puros de solo datos.<br>**Handlers** (`src/commands/*Handler.js`): Orquestan un solo caso de uso.<br>**Repositories/ReadModels** (`src/repositories/*`): Encapsulan la lógica de acceso a la BD.<br>**Servicios** (`AuthService`, `TokenService`): Proveedores de autenticación.<br>**Entidades** (`src/models/Ticket.js`): Lógica e integridad de dominio. | Cumplimiento total. |
| **O** - Abierto/Cerrado | Agregar un nuevo caso de uso (ej. Cerrar Ticket) solo requiere crear dos nuevos archivos (`CloseTicketCommand.js` y `CloseTicketHandler.js`), sin tocar los handlers existentes. | Es *parcial* porque sigue siendo necesario registrar la ruta en `routes/`, invocar al contenedor en `config/container.js` y agregarlo al `Controller`. |
| **L** - Sustitución de Liskov | No hay herencia de clases profunda, todo se ensambla mediante composición de dependencias simples. | No aplica directamente al carecer de herencia relevante. |
| **I** - Segregación de Interfaces | Los `ReadModels` están separados de los `Repositories` (ej. `UserReadModel` vs `UserRepository`). Un handler que solo lee no tiene acceso a los métodos de escritura y viceversa. Cada handler inyecta solo los métodos que necesita. | Cumplimiento total conceptual. |
| **D** - Inversión de Dependencias | Los handlers reciben todo por constructor desde `src/config/container.js` basándose en contratos y tipos documentados en `src/contracts/index.js` (JSDoc). Los repositorios reciben el cliente de BD (`Supabase`) inyectado. | En JavaScript puro el contrato es documental (`JSDoc`). Cambiar de proveedor de BD implicaría reescribir la lógica interna de los repositorios, pero los **Handlers no cambiarían**. |

## Diagrama de la Arquitectura (CQRS Ligero)

El proyecto utiliza un patrón CQRS (Command Query Responsibility Segregation) ligero. Hay una sola base de datos y no se utiliza Event Sourcing, pero sí logramos separar de forma estricta las rutas de **Lectura (Queries)** de las rutas de **Escritura (Commands)**.

```text
[HTTP Request]
       |
  (Controller)
       |
       +---------------------------------------------+
       |                                             |
 (Crea Command)                                (Crea Query)
       |                                             |
   (Handler)                                     (Query)
       |                                             |
 (Repository)                                  (ReadModel)
       |                                             |
 (INSERT/UPDATE DB)                              (SELECT DB)
```
