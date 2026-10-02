# Arquitectura CQRS: Fundamentos y Conceptos Generales

CQRS significa **Command Query Responsibility Segregation** (Segregacion de Responsabilidades en Comandos y Consultas). Es un patron arquitectonico disenado para resolver los problemas de rendimiento y acoplamiento que surgen cuando un mismo modelo de datos se utiliza tanto para escribir como para leer.

---

## 1. La Regla de Oro de CQRS

> **Una operacion o bien cambia el estado del sistema (Command), o bien devuelve un resultado (Query), pero nunca ambas cosas de forma desordenada.**

```text
                           APLICACION CLIENTE (FLUTTER / WEB)
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
       COMANDOS (ESCRITURA)                    CONSULTAS (LECTURA)
       • Crear ticket                          • Ver mis tickets
       • Cambiar estado a En revision          • Ver tickets pendientes
       • Iniciar sesion                        • Ver departamentos
                 │                                       │
                 ▼                                       ▼
       CAPA APPLICATION (Commands)             CAPA APPLICATION (Queries)
                 │                                       │
                 ▼                                       ▼
       CAPA INFRASTRUCTURE                     CAPA INFRASTRUCTURE
       (Write Repositories)                    (Read Models / DTOs)
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     ▼
                            BASE DE DATOS (SUPABASE)
```

---

## 2. Diferencias entre Commands y Queries

| Criterio | Command (Comando / Escritura) | Query (Consulta / Lectura) |
| :--- | :--- | :--- |
| **Objetivo** | Modificar datos o crear un nuevo estado en el sistema. | Consultar y proyectar datos para mostrarlos en pantalla. |
| **Efectos Secundarios** | Si altera la base de datos (INSERT, UPDATE, DELETE). | Cero efectos secundarios (Idempotente). |
| **Prioridad** | Consistencia transaccional, reglas de negocio e integridad. | Velocidad de respuesta y bajo consumo de memoria. |
| **Retorno** | Confirmacion de exito, identificador creado o error de negocio. | DTOs planos optimizados directamente para la interfaz grafica. |
| **Ubicacion en Codigo** | `src/application/commands/` | `src/application/queries/` |
| **Acceso a Datos** | `src/infrastructure/repositories/` | `src/infrastructure/read_models/` |

---

## 3. Ventajas de CQRS en el Proyecto Centrix

1. **Rendimiento Independiente:**  
   En la mayoria de aplicaciones, las lecturas superan a las escrituras en proporcion 10 a 1. Con CQRS, las consultas de lectura (`TicketReadModel`) no ejecutan validaciones complejas de negocio; van directo a proyectar los datos de forma rapida para los ViewModels de Flutter.
2. **Seguridad y Trazabilidad:**  
   Las operaciones criticas (como cambiar el estado de un ticket o iniciar sesion) pasan por comandos fuertemente blindados donde es obligatorio validar permisos de rol y registrar auditoria.
3. **Escalabilidad y Mantenibilidad:**  
   Si la interfaz de Flutter cambia de diseno y necesita campos calculados adicionales (por ejemplo, mostrar el tiempo transcurrido desde la creacion del ticket), solo se modifica el `ReadModel` sin riesgo de romper la logica de persistencia o negocio.
