-- =============================================================================
-- Comandos SQL para consultar y cambiar el departamento o el rol de usuarios
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) CONSULTAR ESTADO ACTUAL DE USUARIOS, ROLES Y DEPARTAMENTOS
-- -----------------------------------------------------------------------------
SELECT
  u.id,
  u.full_name,
  u.email,
  u.department_id,
  d.name AS department_name,
  r.id AS role_id,
  r.descripcion AS role_name
FROM public.users u
LEFT JOIN public.departments d ON d.id = u.department_id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
ORDER BY u.created_at DESC;

-- Ver catálogo de departamentos disponibles:
SELECT id, name, description FROM public.departments ORDER BY name;

-- Ver catálogo de roles disponibles:
SELECT id, descripcion FROM public.roles ORDER BY id;


-- -----------------------------------------------------------------------------
-- B) CAMBIAR EL DEPARTAMENTO DE UN USUARIO (por email o por id)
-- -----------------------------------------------------------------------------
-- Asignar un departamento específico:
UPDATE public.users
SET department_id = '<UUID_DEL_DEPARTAMENTO>'
WHERE email = 'usuario@centrix.com';

-- Quitar departamento (ej. para un administrador):
UPDATE public.users
SET department_id = NULL
WHERE email = 'admin.test@centrix.com';


-- -----------------------------------------------------------------------------
-- C) CAMBIAR EL ROL DE UN USUARIO (resolviendo por descripcion sin asumir IDs)
--    Valores válidos de rol: 'colaborador', 'soporte_tecnico', 'gerente', 'administrador'
-- -----------------------------------------------------------------------------
BEGIN;

-- 1. Eliminar roles anteriores del usuario
DELETE FROM public.user_roles
WHERE user_id = (SELECT id FROM public.users WHERE email = 'usuario@centrix.com');

-- 2. Asignar el nuevo rol (cambia 'soporte_tecnico' por el rol deseado)
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'soporte_tecnico'
WHERE u.email = 'usuario@centrix.com';

COMMIT;


-- -----------------------------------------------------------------------------
-- D) CONFIGURACIÓN RÁPIDA EN LOTE PARA LOS 4 USUARIOS DE PRUEBA
--    (colab.test, soporte.test, gerente.test, admin.test — Password: Centrix2026!)
-- -----------------------------------------------------------------------------
BEGIN;

-- Asigna el primer departamento disponible a colaborador, soporte y gerente
WITH target_dept AS (
  SELECT id FROM public.departments ORDER BY created_at ASC NULLS LAST, id ASC LIMIT 1
)
UPDATE public.users
SET department_id = (SELECT id FROM target_dept)
WHERE email IN (
  'colab.test@centrix.com',
  'soporte.test@centrix.com',
  'gerente.test@centrix.com'
);

UPDATE public.users
SET department_id = NULL
WHERE email = 'admin.test@centrix.com';

-- Limpia roles actuales de los 4 usuarios de prueba
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM public.users
  WHERE email IN (
    'colab.test@centrix.com',
    'soporte.test@centrix.com',
    'gerente.test@centrix.com',
    'admin.test@centrix.com'
  )
);

-- Asigna cada rol correspondiente
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'colaborador'
WHERE u.email = 'colab.test@centrix.com';

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'soporte_tecnico'
WHERE u.email = 'soporte.test@centrix.com';

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'gerente'
WHERE u.email = 'gerente.test@centrix.com';

INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u
JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'administrador'
WHERE u.email = 'admin.test@centrix.com';

COMMIT;

