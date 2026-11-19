#!/usr/bin/env python3
"""
Script E2E para probar todos los endpoints del módulo de Tickets y Solvers de Centrix.

Uso:
  1. Inicia el servidor backend: npm run dev (o npm start)
  2. Configura las credenciales de prueba en variables de entorno o edita el bloque CONFIG abajo.
  3. Ejecuta: python docs/test_tickets_e2e.py
"""

import os
import sys
import json
import urllib.request
import urllib.error
import urllib.parse

BASE_URL = os.getenv("CENTRIX_BASE_URL", "http://localhost:3000")

# Credenciales configuradas para los 4 roles de prueba
USERS = {
    "colaborador": {
        "email": os.getenv("COLAB_EMAIL", "colab.test@centrix.com"),
        "password": os.getenv("COLAB_PASSWORD", "Centrix2026!"),
    },
    "soporte": {
        "email": os.getenv("SOPORTE_EMAIL", "soporte.test@centrix.com"),
        "password": os.getenv("SOPORTE_PASSWORD", "Centrix2026!"),
    },
    "gerente": {
        "email": os.getenv("GERENTE_EMAIL", "regina.ti23@utsjr.edu.com"),
        "password": os.getenv("GERENTE_PASSWORD", "G3racltt03"),
    },
    "admin": {
        "email": os.getenv("ADMIN_EMAIL", "g03.gudicruz@gmail.com"),
        "password": os.getenv("ADMIN_PASSWORD", "G3racltt03"),
    },
}


def http_request(method: str, path: str, token: str = None, body: dict = None, query: dict = None):
    url = f"{BASE_URL.rstrip('/')}{path}"
    if query:
        clean_query = {k: v for k, v in query.items() if v is not None}
        if clean_query:
            url = f"{url}?{urllib.parse.urlencode(clean_query)}"

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


def assert_status(step_name: str, actual: int, expected: int, payload: dict):
    status_icon = "OK" if actual == expected else "FAIL"
    print(f"[{status_icon}] {step_name} -> HTTP {actual} (esperado {expected})")
    if actual != expected:
        print("     Respuesta:", json.dumps(payload, indent=2, ensure_ascii=False))
        sys.exit(1)


def login(role_key: str) -> tuple[str, dict]:
    creds = USERS[role_key]
    status, body = http_request("POST", "/api/auth/login", body=creds)
    assert_status(f"Login ({role_key}: {creds['email']})", status, 200, body)
    return body["data"]["token"], body["data"]["user"]


def main():
    print(f"=== Iniciando pruebas E2E contra {BASE_URL} ===\n")

    # 0. Healthcheck
    status, body = http_request("GET", "/health")
    assert_status("GET /health", status, 200, body)

    # 1. Autenticación de los roles
    colab_token, colab_user = login("colaborador")
    gerente_token, gerente_user = login("gerente")
    admin_token, admin_user = login("admin")

    # Soporte técnico es opcional si aún no tienes usuario creado con ese rol en Auth
    soporte_token, soporte_user = None, None
    try:
        soporte_token, soporte_user = login("soporte")
    except SystemExit:
        print("[WARN] No se pudo autenticar usuario 'soporte'; se omitirán los pasos exclusivos de soporte_tecnico.")

    # 2. Consultar catálogo de departamentos (GET /api/departments)
    status, depts_resp = http_request("GET", "/api/departments", token=colab_token)
    assert_status("GET /api/departments", status, 200, depts_resp)
    departments = depts_resp.get("data") or []
    if not departments:
        print("[FAIL] No hay departamentos registrados en la BD.")
        sys.exit(1)
    target_dept_id = os.getenv(
        "TEST_DEPARTMENT_ID",
        departments[0].get("departmentId") or departments[0].get("id"),
    )
    print(f"     Usando department_id = {target_dept_id}")

    # 3. Crear Ticket #1 (flujo completo hasta Cerrado) como colaboradora
    status, create_resp = http_request(
        "POST",
        "/api/tickets",
        token=colab_token,
        body={
            "title": "Impresora de red no responde (Prueba E2E)",
            "description": "No permite imprimir desde el área administrativa",
            "priority": "Alta",
            "department_id": target_dept_id,
        },
    )
    assert_status("POST /api/tickets (colaborador crea Ticket #1)", status, 201, create_resp)
    ticket_1_id = create_resp["data"]["id"]
    print(f"     Ticket #1 creado: {ticket_1_id}")

    # 4. Consultar mis tickets (GET /api/tickets/mine)
    status, mine_resp = http_request("GET", "/api/tickets/mine", token=colab_token)
    assert_status("GET /api/tickets/mine (colaborador)", status, 200, mine_resp)

    # 5. Adjuntar evidencia al Ticket #1 (POST /api/tickets/:id/attachments)
    status, att_resp = http_request(
        "POST",
        f"/api/tickets/{ticket_1_id}/attachments",
        token=colab_token,
        body={
            "file_url": f"ticket-attachments/{ticket_1_id}/evidencia-inicial.png",
            "file_format": "png",
            "size_bytes": 128000,
        },
    )
    assert_status("POST /api/tickets/:id/attachments (colaborador adjunta evidencia)", status, 201, att_resp)

    # 6. Consultar detalle del ticket con URLs firmadas (GET /api/tickets/:id)
    status, detail_resp = http_request("GET", f"/api/tickets/{ticket_1_id}", token=colab_token)
    assert_status("GET /api/tickets/:id (detalle con URLs firmadas)", status, 200, detail_resp)

    # 7. Consultar tickets del departamento como gerente (GET /api/tickets/department)
    status, dept_tickets_resp = http_request("GET", "/api/tickets/department", token=gerente_token)
    assert_status("GET /api/tickets/department (gerente sin query param)", status, 200, dept_tickets_resp)

    # 8. Consultar solucionadores del departamento (GET /api/users/solvers)
    status, solvers_resp = http_request("GET", "/api/users/solvers", token=gerente_token)
    assert_status("GET /api/users/solvers (gerente)", status, 200, solvers_resp)
    solvers = solvers_resp.get("data") or []

    # 9. Asignar Ticket #1 a un soporte_tecnico si existe en el departamento
    solver_id = None
    if solvers:
        if soporte_user and any(s["id"] == soporte_user["id"] for s in solvers):
            solver_id = soporte_user["id"]
        else:
            solver_id = solvers[0]["id"]

        status, assign_resp = http_request(
            "PATCH",
            f"/api/tickets/{ticket_1_id}/assign",
            token=gerente_token,
            body={"assigned_to": solver_id},
        )
        assert_status(f"PATCH /api/tickets/:id/assign (asignar a {solver_id})", status, 200, assign_resp)

        # Asignar de nuevo al mismo usuario debe devolver 409
        status, dup_assign_resp = http_request(
            "PATCH",
            f"/api/tickets/{ticket_1_id}/assign",
            token=gerente_token,
            body={"assigned_to": solver_id},
        )
        assert_status("PATCH /api/tickets/:id/assign (mismo solver -> 409)", status, 409, dup_assign_resp)
    else:
        print("[INFO] No hay usuarios soporte_tecnico en el departamento del gerente; se omite prueba de asignación.")

    # 10. Si tenemos token de soporte_tecnico y fue asignado a él, probar GET /assigned y cambio de estado
    if soporte_token and soporte_user and solver_id == soporte_user["id"]:
        status, assigned_resp = http_request("GET", "/api/tickets/assigned", token=soporte_token)
        assert_status("GET /api/tickets/assigned (soporte_tecnico)", status, 200, assigned_resp)

        status, st1 = http_request(
            "PATCH",
            f"/api/tickets/{ticket_1_id}/status",
            token=soporte_token,
            body={"status": "En progreso", "comment": "Iniciando diagnóstico"},
        )
        assert_status("PATCH /api/tickets/:id/status (soporte -> En progreso)", status, 200, st1)

        # Resuelto sin comentario debe fallar con 400
        status, st_bad = http_request(
            "PATCH",
            f"/api/tickets/{ticket_1_id}/status",
            token=soporte_token,
            body={"status": "Resuelto"},
        )
        assert_status("PATCH /api/tickets/:id/status (Resuelto sin comentario -> 400)", status, 400, st_bad)

        status, st2 = http_request(
            "PATCH",
            f"/api/tickets/{ticket_1_id}/status",
            token=soporte_token,
            body={"status": "Resuelto", "comment": "Se reemplazó cable de red y se reinició spooler"},
        )
        assert_status("PATCH /api/tickets/:id/status (soporte -> Resuelto con comentario)", status, 200, st2)

        # Soporte no puede pasar a Cerrado (403)
        status, st_forbidden = http_request(
            "PATCH",
            f"/api/tickets/{ticket_1_id}/status",
            token=soporte_token,
            body={"status": "Cerrado", "comment": "Intento cerrar"},
        )
        assert_status("PATCH /api/tickets/:id/status (soporte -> Cerrado -> 403)", status, 403, st_forbidden)
    else:
        # Cambiar estados con el gerente/admin
        status, _ = http_request(
            "PATCH",
            f"/api/tickets/{ticket_1_id}/status",
            token=gerente_token,
            body={"status": "En progreso", "comment": "Atendiendo incidente"},
        )
        assert_status("PATCH /api/tickets/:id/status (gerente -> En progreso)", status, 200, _)

        status, _ = http_request(
            "PATCH",
            f"/api/tickets/{ticket_1_id}/status",
            token=gerente_token,
            body={"status": "Resuelto", "comment": "Quedó operativo"},
        )
        assert_status("PATCH /api/tickets/:id/status (gerente -> Resuelto)", status, 200, _)

    # 11. Gerente cierra el Ticket #1 (Resuelto -> Cerrado)
    status, close_resp = http_request(
        "PATCH",
        f"/api/tickets/{ticket_1_id}/status",
        token=gerente_token,
        body={"status": "Cerrado", "comment": "Validado con el solicitante"},
    )
    assert_status("PATCH /api/tickets/:id/status (gerente -> Cerrado)", status, 200, close_resp)

    # 12. Crear Ticket #2 para probar flujo de Rechazo (Abierto -> Rechazado)
    status, create_2_resp = http_request(
        "POST",
        "/api/tickets",
        token=colab_token,
        body={
            "title": "Ticket duplicado para prueba de rechazo",
            "description": "Solicitud repetida",
            "priority": "Baja",
            "department_id": target_dept_id,
        },
    )
    assert_status("POST /api/tickets (colaborador crea Ticket #2)", status, 201, create_2_resp)
    ticket_2_id = create_2_resp["data"]["id"]

    # Rechazar sin comentario -> 400
    status, rej_bad = http_request(
        "PATCH",
        f"/api/tickets/{ticket_2_id}/status",
        token=gerente_token,
        body={"status": "Rechazado"},
    )
    assert_status("PATCH /api/tickets/:id/status (Rechazado sin comentario -> 400)", status, 400, rej_bad)

    # Rechazar con comentario -> 200
    status, rej_ok = http_request(
        "PATCH",
        f"/api/tickets/{ticket_2_id}/status",
        token=gerente_token,
        body={"status": "Rechazado", "comment": "Duplicado del ticket principal"},
    )
    assert_status("PATCH /api/tickets/:id/status (gerente -> Rechazado con comentario)", status, 200, rej_ok)

    # 13. Consulta global de tickets como administrador con filtros y paginación (GET /api/tickets)
    status, all_resp = http_request(
        "GET",
        "/api/tickets",
        token=admin_token,
        query={"status": "Rechazado", "department_id": target_dept_id, "priority": "Baja", "page": 1, "limit": 10},
    )
    assert_status("GET /api/tickets (admin con filtros y paginación)", status, 200, all_resp)

    # Verificar que gerente recibe 403 en GET /api/tickets
    status, forbidden_all = http_request("GET", "/api/tickets", token=gerente_token)
    assert_status("GET /api/tickets (gerente -> 403)", status, 403, forbidden_all)

    # 14. Borrado lógico por administrador (DELETE /api/tickets/:id)
    status, del_resp = http_request("DELETE", f"/api/tickets/{ticket_2_id}", token=admin_token)
    assert_status("DELETE /api/tickets/:id (admin soft-delete Ticket #2)", status, 200, del_resp)

    print("\n=== Todas las pruebas E2E finalizaron exitosamente ===")


if __name__ == "__main__":
    main()

