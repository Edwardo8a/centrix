#!/usr/bin/env python3
"""
Script para crear 4 usuarios de prueba (1 por cada rol: colaborador, soporte_tecnico, gerente, administrador)
vía el endpoint POST /api/admin/users y generar el SQL exacto para asignarles rol y departamento en Supabase.

Contraseña por defecto para los 4 usuarios creados:
  Centrix2026!

Uso:
  1. Inicia el backend: npm run dev
  2. Configura las credenciales de un administrador existente (ej. Gerardo o Miguel):
       $env:ADMIN_BOOTSTRAP_EMAIL="tu_admin_actual@correo.com"
       $env:ADMIN_BOOTSTRAP_PASSWORD="tu_password_actual"
  3. Ejecuta:
       python docs/create_test_users.py
  4. Copia y ejecuta en el SQL Editor de Supabase el bloque SQL que imprime el script al terminar.
"""

import os
import sys
import json
import urllib.request
import urllib.error

BASE_URL = os.getenv("CENTRIX_BASE_URL", "http://localhost:3000")

# Administrador existente para autenticar la creación de los 4 usuarios nuevos
BOOTSTRAP_ADMIN = {
    "email": os.getenv("ADMIN_BOOTSTRAP_EMAIL", "gerardo@centrix.com"),
    "password": os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "Password123!"),
}

# Contraseña única para los 4 usuarios nuevos de prueba
DEFAULT_NEW_USERS_PASSWORD = os.getenv("NEW_USERS_PASSWORD", "Centrix2026!")

# Los 4 usuarios nuevos que se crearán (por defecto nacen como 'colaborador' en UserRepository)
NEW_USERS = [
    {
        "target_role": "colaborador",
        "needs_department": True,
        "payload": {
            "email": "colab.test@centrix.com",
            "password": DEFAULT_NEW_USERS_PASSWORD,
            "nombre": "Laura",
            "apellido_pat": "Colaboradora",
            "apellido_mat": "Test",
            "tel": "5511111111",
        },
    },
    {
        "target_role": "soporte_tecnico",
        "needs_department": True,
        "payload": {
            "email": "soporte.test@centrix.com",
            "password": DEFAULT_NEW_USERS_PASSWORD,
            "nombre": "Carlos",
            "apellido_pat": "Soporte",
            "apellido_mat": "Test",
            "tel": "5522222222",
        },
    },
    {
        "target_role": "gerente",
        "needs_department": True,
        "payload": {
            "email": "gerente.test@centrix.com",
            "password": DEFAULT_NEW_USERS_PASSWORD,
            "nombre": "Diana",
            "apellido_pat": "Gerente",
            "apellido_mat": "Test",
            "tel": "5533333333",
        },
    },
    {
        "target_role": "administrador",
        "needs_department": False,
        "payload": {
            "email": "admin.test@centrix.com",
            "password": DEFAULT_NEW_USERS_PASSWORD,
            "nombre": "Roberto",
            "apellido_pat": "Admin",
            "apellido_mat": "Test",
            "tel": "5544444444",
        },
    },
]


def http_request(method: str, path: str, token: str = None, body: dict = None):
    url = f"{BASE_URL.rstrip('/')}{path}"
    headers = {"Accept": "application/json"}
    data = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"raw": raw}
        return err.code, parsed


def main():
    print(f"=== Creando 4 usuarios de prueba en {BASE_URL} ===")
    print(f"Contraseña para los 4 usuarios: {DEFAULT_NEW_USERS_PASSWORD}\n")

    # 1. Login con administrador existente
    status, login_resp = http_request("POST", "/api/auth/login", body=BOOTSTRAP_ADMIN)
    if status != 200:
        print(f"[ERROR] No se pudo iniciar sesión con el admin ({BOOTSTRAP_ADMIN['email']}): HTTP {status}")
        print(json.dumps(login_resp, indent=2, ensure_ascii=False))
        print("\nConfigura ADMIN_BOOTSTRAP_EMAIL y ADMIN_BOOTSTRAP_PASSWORD con tu admin actual.")
        sys.exit(1)

    admin_token = login_resp["data"]["token"]
    print(f"[OK] Autenticado como administrador: {BOOTSTRAP_ADMIN['email']}")

    # 2. Obtener un department_id válido para sugerirlo en el SQL
    status, depts_resp = http_request("GET", "/api/departments", token=admin_token)
    departments = (depts_resp.get("data") or []) if status == 200 else []
    default_dept_id = (
        (departments[0].get("departmentId") or departments[0].get("id"))
        if departments
        else "<TU_DEPARTMENT_UUID>"
    )
    default_dept_name = departments[0].get("name", "") if departments else ""

    # 3. Crear cada uno de los 4 usuarios vía POST /api/admin/users
    created_users = []
    for item in NEW_USERS:
        payload = item["payload"]
        email = payload["email"]
        status, resp = http_request("POST", "/api/admin/users", token=admin_token, body=payload)
        if status == 201:
            user_id = resp["data"]["id"]
            print(f"[OK] Usuario creado: {email} (id: {user_id}) -> rol objetivo: {item['target_role']}")
            created_users.append({**item, "id": user_id})
        else:
            print(f"[WARN] No se creó {email} (HTTP {status}): {resp.get('message', resp)}")
            created_users.append({**item, "id": None})

    # 4. Imprimir el bloque SQL listo para ejecutar en Supabase
    print("\n" + "=" * 75)
    print("SQL PARA SUPABASE (asigna departamento y rol a los 4 usuarios creados)")
    print(f"Departamento detectado: {default_dept_id} ({default_dept_name})")
    print("=" * 75 + "\n")

    sql_lines = [
        "BEGIN;",
        "",
        "-- 1. Asignar el mismo department_id a colaborador, soporte_tecnico y gerente",
        f"UPDATE public.users",
        f"SET department_id = '{default_dept_id}'",
        "WHERE email IN (",
        "  'colab.test@centrix.com',",
        "  'soporte.test@centrix.com',",
        "  'gerente.test@centrix.com'",
        ");",
        "",
        "-- El administrador no requiere departamento (NULL)",
        "UPDATE public.users",
        "SET department_id = NULL",
        "WHERE email = 'admin.test@centrix.com';",
        "",
        "-- 2. Reemplazar el rol de cada usuario resolviendo el role_id por descripcion (case-insensitive)",
        "DELETE FROM public.user_roles",
        "WHERE user_id IN (",
        "  SELECT id FROM public.users",
        "  WHERE email IN (",
        "    'colab.test@centrix.com',",
        "    'soporte.test@centrix.com',",
        "    'gerente.test@centrix.com',",
        "    'admin.test@centrix.com'",
        "  )",
        ");",
        "",
        "-- Colaborador",
        "INSERT INTO public.user_roles (user_id, role_id)",
        "SELECT u.id, r.id",
        "FROM public.users u",
        "JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'colaborador'",
        "WHERE u.email = 'colab.test@centrix.com';",
        "",
        "-- Soporte Técnico (Solucionador)",
        "INSERT INTO public.user_roles (user_id, role_id)",
        "SELECT u.id, r.id",
        "FROM public.users u",
        "JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'soporte_tecnico'",
        "WHERE u.email = 'soporte.test@centrix.com';",
        "",
        "-- Gerente",
        "INSERT INTO public.user_roles (user_id, role_id)",
        "SELECT u.id, r.id",
        "FROM public.users u",
        "JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'gerente'",
        "WHERE u.email = 'gerente.test@centrix.com';",
        "",
        "-- Administrador",
        "INSERT INTO public.user_roles (user_id, role_id)",
        "SELECT u.id, r.id",
        "FROM public.users u",
        "JOIN public.roles r ON LOWER(TRIM(r.descripcion)) = 'administrador'",
        "WHERE u.email = 'admin.test@centrix.com';",
        "",
        "COMMIT;",
    ]
    print("\n".join(sql_lines))


if __name__ == "__main__":
    main()

