# Arquitectura CQRS: Fundamentos y Conceptos Generales

CQRS significa **Command Query Responsibility Segregation** (Segregacion de Responsabilidades en Comandos y Consultas). Es un patron arquitectonico disenado para separar estrictamente las operaciones que modifican informacion de aquellas que simplemente consultan datos.

---

## 1. La Regla de Oro de CQRS

> **Una operacion o bien cambia el estado del sistema (Command), o bien devuelve un resultado (Query), pero nunca ambas cosas de forma desordenada.**

```text
                           APLICACION CLIENTE (FLUTTER / WEB)
                                          |
                 +------------------------+------------------------+
                 |                                                 |
                 v                                                 v
       COMANDOS (ESCRITURA)                              CONSULTAS (LECTURA)
       - Crear ticket                                    - Ver departamentos
       - Iniciar sesion                                  - Ver tickets por departamento
       - Registrar usuario
                 |                                                 |
                 v                                                 v
        [src/commands/*Handler.js]                       [src/queries/*Query.js]
                 |                                                 |
                 v                                                 v
       REPOSITORIOS DE ESCRITURA                         MODELOS DE LECTURA (ReadModels)
       (src/repositories/*Repository.js)                 (src/repositories/*ReadModel.js)
                 |                                                 |
                 +------------------------+------------------------+
                                          |
                                          v
                               BASE DE DATOS (SUPABASE)
```

---

## 2. Diferencias entre Commands y Queries

| Criterio | Command (Comando / Escritura) | Query (Consulta / Lectura) |
| :--- | :--- | :--- |
| **Objetivo** | Modificar datos o crear un nuevo estado en el sistema. | Consultar y proyectar datos para mostrarlos en pantalla. |
| **Efectos Secundarios** | Altera la base de datos (INSERT, UPDATE, DELETE). | Cero efectos secundarios (Idempotente y seguro). |
| **Componentes** | `Command` (DTO) + `Handler` (Orquestador) + `Repository` | `Query` (DTO / Ejecutor) + `ReadModel` (Proyeccion) |
| **Respuestas** | Identificador del recurso (`{ id }`), o confirmacion. | DTOs estructurados listos para los ViewModels del cliente. |

---

## 3. Beneficios de CQRS en Centrix

1. **Modelos Especializados:** El modelo para crear un ticket solo requiere validar titulo, descripcion y prioridad. El modelo para leer tickets hace joins complejos con usuarios y departamentos.
2. **Seguridad y Control:** Las escrituras pasan por validaciones de negocio rigurosas, mientras que las lecturas son directas y rapidas.
3. **Mantenibilidad:** Modificar como se consulta una pantalla no altera en absoluto la logica transaccional de creacion de datos.
