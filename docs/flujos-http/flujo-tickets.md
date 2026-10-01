# Flujo de Ejecucion HTTP: Modulo de Tickets (HU-05)

Este documento describe la ruta exacta que recorre una peticion HTTP para el cambio de estado de un ticket (HU-05: cambio a 'En revision' y notificacion al creador).

---

## 1. Diagrama de la Ruta HTTP

```text
1. FLUTTER (TicketDetailScreen)
   Envia: PATCH /api/tickets/:ticketId/status
   Header: Authorization: Bearer <TOKEN>
   Body  : { "status": "En revision", "comment": "Analizando problema" }
      │
      ▼
2. ENRUTADOR (src/interfaces/routes/ticketRoutes.js)
   Intercepta la ruta y aplica tres filtros en serie:
      ├── Filtro 1: authMiddleware (Verifica validez del JWT)
      ├── Filtro 2: roleCheck (Verifica rol: admin, gerente, soporte_tecnico)
      └── Filtro 3: updateTicketStatusValidator (Verifica que status sea texto no vacio)
      │
      ▼
3. CONTROLADOR (src/interfaces/controllers/TicketCommandController.js)
   Desempaqueta ticketId (URL), status y comment (Body), y userId (Token)
   Llama a updateTicketStatusCommand.execute(...)
      │
      ▼
4. COMANDO DE APLICACION (src/application/commands/tickets/UpdateTicketStatusCommand.js)
   Ejecuta las reglas de negocio de la HU-05:
      ├── Paso 4A: Busca el ticket con ticketRepository.findById(ticketId)
      │            • Si no existe: Lanza BusinessError(404)
      │
      ├── Paso 4B: Normaliza el estado con normalizeTicketStatus(newStatus)
      │            • Valida que no este cerrado ni sea igual al estado actual
      │
      ├── Paso 4C: Actualiza la tabla tickets via ticketRepository.updateStatus()
      │            • PPS-90: Coloca status = 'En revision' y actualiza fecha
      │
      ├── Paso 4D: Inserta en ticket_status_history via ticketRepository.recordStatusHistory()
      │            • PPS-90: Guarda ticketId, userId, previousStatus, newStatus, comment
      │
      └── Paso 4E: Notifica al usuario creador via notificationService.notifyUser()
                   • PPS-91: Busca correo del creador y envia aviso explicativo
      │
      ▼
5. FORMATEADOR DE RESPUESTA (src/utils/responseBuilder.js)
   TicketCommandController recibe el resultado del comando y responde:
   HTTP 200 OK con { previousStatus, newStatus, creatorNotified: true }
      │
      ▼
6. FLUTTER (TicketDetailViewModel)
   Actualiza la vista del ticket con el nuevo estado 'En revision'
```

---

## 2. Detalle Tecnico de Cada Paso

### Paso 1: Peticion desde la App
Un usuario con rol de soporte tecnico o administrador selecciona la opcion de cambiar el estado de un ticket y la app móvil emite una peticion `PATCH /api/tickets/:id/status` incluyendo su token Bearer en el encabezado.

### Paso 2: Filtros de Seguridad y Validacion (Middlewares)
1. **`authMiddleware` ([auth.js](file:///D:/Centrix/centrixBack/src/interfaces/middlewares/auth.js)):**  
   Extrae el token del header `Authorization`. Si no existe o expiro, detiene la peticion con codigo **401 Unauthorized**. Si es valido, decodifica el token y coloca los datos en `req.user`.
2. **`roleCheck` ([roleCheck.js](file:///D:/Centrix/centrixBack/src/interfaces/middlewares/roleCheck.js)):**  
   Revisa los roles de `req.user`. Comprueba si el usuario tiene permiso (`administrador`, `gerente`, `soporte_tecnico`, `soporte`). Si es un colaborador normal, rechaza con **403 Forbidden**.
3. **`updateTicketStatusValidator` ([ticketValidator.js](file:///D:/Centrix/centrixBack/src/interfaces/validators/ticketValidator.js)):**  
   Comprueba que el cuerpo contenga el campo `status`. Si viene nulo o vacio, rechaza con **400 Bad Request**.

### Paso 3: Controlador ([TicketCommandController.js](file:///D:/Centrix/centrixBack/src/interfaces/controllers/TicketCommandController.js))
En el metodo `updateStatus`:
- Extrae `ticketId` de los parametros de ruta (`req.params`).
- Extrae `status` y `comment` del cuerpo (`req.body`).
- Extrae el identificador del usuario que realiza la accion (`req.user.id`).
- Invoca `updateTicketStatusCommand.execute()`.

### Paso 4: Logica de Negocio ([UpdateTicketStatusCommand.js](file:///D:/Centrix/centrixBack/src/application/commands/tickets/UpdateTicketStatusCommand.js))
El comando ejecuta las reglas de la HU-05 en estricto orden:
1. Valida que el ticket exista en la base de datos (error 404 si no existe).
2. Normaliza el estado entrante mediante `normalizeTicketStatus`.
3. Valida que el ticket no se encuentre ya en ese estado ni se encuentre en estado `Cerrado`.
4. **PPS-90:** Actualiza el estado en la tabla `tickets`.
5. **PPS-90:** Inserta el movimiento en la tabla de historial `ticket_status_history` / `ticket_historial_estados` para auditoria.
6. **PPS-91:** Obtiene el `created_by` (creador de la incidencia) y llama a `notificationService.notifyUser` para enviarle el correo o alerta.
7. Registra la auditoria general con `auditService.logAction`.

### Paso 5: Respuesta al Cliente
El controlador envia al cliente un JSON con codigo **200 OK** conteniendo el ticket modificado y la confirmacion de notificacion enviada.
Cualquier error de negocio que haya ocurrido en el camino es atrapado por `errorHandler.js`, garantizando respuestas limpias y seguras.
