# Guía Estandarizada de Convenciones de Git y Pull Requests

Esta guía define el flujo de trabajo oficial de Git (**Gitflow adaptado**), las convenciones de nombres de ramas, el formato de mensajes de commit (**Conventional Commits**) y las reglas para la creación y aprobación de **Pull Requests (PR)** en el proyecto **Centrix Backend**.

---

## 1. Estrategia de Ramificación (Gitflow Adaptado)

El repositorio mantiene tres ramas principales permanentes y ramas temporales de desarrollo.

```
                   ┌───────────────────────────────────────────────┐
                   │                     main                      │ (Producción / Relegables)
                   └───────────────────────▲───────────────────────┘
                                           │ hotfix / release
                   ┌───────────────────────┴───────────────────────┐
                   │                      dev                      │ (Integración Principal)
                   └───────────────────────▲───────────────────────┘
                                           │ feature / bugfix
                   ┌───────────────────────┴───────────────────────┐
                   │                     sprint                    │ (Integración de Sprint Activo)
                   └───────────────────────────────────────────────┘
```

### 1.1. Ramas Permanentes
- **`main`**: Refleja el código en producción o listo para producción. Debe ser 100% estable. No se permiten commits directos.
- **`dev`**: Rama principal de integración para desarrollo continuo. Todo nuevo desarrollo se consolida aquí antes de pasar a `main`.
- **`sprint`**: Rama de integración específica para las tareas del sprint en curso.

### 1.2. Ramas Temporales (Feature, Bugfix, Hotfix, Release)

| Tipo | Nombra tu rama como... | Origen desde | Merge hacia | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Feature** | `feature/<ticket-id>-<descripcion-corta>` | `sprint` / `dev` | `sprint` / `dev` | Nueva funcionalidad o módulo. |
| **Bugfix** | `bugfix/<ticket-id>-<descripcion-corta>` | `sprint` / `dev` | `sprint` / `dev` | Corrección de errores en entorno de desarrollo. |
| **Hotfix** | `hotfix/v<x.y.z>-<descripcion-corta>` | `main` | `main` y `dev` | Corrección urgente de un error crítico en producción. |
| **Release** | `release/v<x.y.z>` | `dev` | `main` y `dev` | Preparación de una nueva versión lista para desplegar. |

#### Ejemplos de Nombres de Ramas:
- `feature/CNX-101-login-jwt`
- `feature/CNX-105-cqrs-ticket-command`
- `bugfix/CNX-202-fix-expense-status-validation`
- `hotfix/v1.0.1-security-patch`

---

## 2. Convención de Mensajes de Commit (Conventional Commits)

Todos los commits deben seguir la especificación de **Conventional Commits**:

```text
<tipo>(<alcance opcional>): <descripción breve en presente/imperativo>

[cuerpo opcional explicativo]

[pie de página opcional, ej. Closes #123]
```

### Tipos de Commit Permitidos:
- **`feat`**: Una nueva característica para el usuario o sistema. (Ej. `feat(tickets): implement CreateTicketCommand with ACID fallback`)
- **`fix`**: Corrección de un fallo o error en el código. (Ej. `fix(auth): update token expiration logic`)
- **`docs`**: Cambios exclusivamente en documentación. (Ej. `docs(readme): add setup instructions`)
- **`style`**: Cambios de formato, comas, espacios sin afectar lógica (Prettier/ESLint).
- **`refactor`**: Reestructuración de código que no corrige errores ni añade características.
- **`perf`**: Cambio en el código que mejora el rendimiento.
- **`test`**: Adición o corrección de pruebas unitarias/integración.
- **`chore`**: Tareas de mantenimiento, actualización de dependencias o configuración.
- **`ci`**: Cambios en archivos de configuración de CI/CD (GitHub Actions).

#### Ejemplos de Commits Válidos:
```bash
git commit -m "feat(expenses): add CreateExpenseCommand and repository persistence"
git commit -m "fix(tickets): resolve unassigned status on TicketRepository"
git commit -m "docs(gitflow): add Git conventions and PR rules guide"
```

---

## 3. Reglas y Ciclo de Vida de Pull Requests (PR)

Para fusionar cualquier rama hacia `sprint`, `dev` o `main`, es **obligatorio** abrir un Pull Request en GitHub.

### 3.1. Requisitos para Abrir un PR
1. **Título Estructurado**: El título del PR debe indicar el tipo de cambio y ticket.
   - Ejemplo: `[Feature] CNX-101: Implementación de autenticación JWT`
2. **Plantilla de PR Completa**: Debe usarse la plantilla oficial (`.github/PULL_REQUEST_TEMPLATE.md`).
3. **Paso de Verificación Local**: Ejecutar antes de enviar:
   ```bash
   npm run type-check
   ```

### 3.2. Criterios de Aprobación y Merge
- **Aprobaciones mínimas**: Al menos **1 revisión aprobada** por un desarrollador / líder técnico.
- **Integración Continua (CI)**: El workflow de GitHub Actions (`ci.yml`) debe estar en **Verde (Passed)**.
- **Estrategia de Merge**:
  - Para `feature/*` -> `dev`/`sprint`: **Squash and Merge** (para mantener un historial limpio).
  - Para `release/*` / `hotfix/*` -> `main`: **Merge Commit** o **Rebase and Merge**.
- **Limpieza**: Borrar la rama remota temporal inmediatamente después de completar el merge.

---

## 4. Protección de Ramas Recomendada (GitHub Branch Protection)

Se recomienda configurar las siguientes reglas en GitHub Repository Settings (`Settings > Branches`):

1. **Rama `main`**:
   - [x] Require a pull request before merging
   - [x] Require status checks to pass before merging (`ci / build-and-typecheck`)
   - [x] Require linear history
   - [x] Do not allow bypassing the above settings

2. **Rama `dev`**:
   - [x] Require a pull request before merging
   - [x] Require status checks to pass before merging
