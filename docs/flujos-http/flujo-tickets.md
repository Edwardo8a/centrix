# Flujo de Ejecucion HTTP: Modulo de Tickets (HU-05)

Este documento describe la ruta exacta que recorre una peticion HTTP para el cambio de estado de un ticket (HU-05: cambio a 'En revision' y notificacion al creador).

---

## 1. Diagrama de la Ruta HTTP

```text
1. FLUTTER (TicketDetailScreen)
   Envia: PATCH /api/tickets/:ticketId/status
   Header: Authorization: Bearer <TOKEN>
   Body  : { "status": "En revision", "comment": "Analizando problema" }
      |
      v
2. ENRUTADOR (src/routes/ticketRoutes.js)
   Intercepta la ruta y aplica tres filtros en serie:
      |-- Filtro 1: authMiddleware (Verifica validez del JWT)
      |-- Filtro 2: roleCheck (Verifica rol: admin, gerente, soporte_tecnico)
      `-- Filtro 3: updateTicketStatusValidator (Verifica que status sea texto no vacio)
      |
      v
3. CONTROLADOR (src/controllers/TicketCommandController.js)
   Desempaqueta ticketId (URL), status y comment (Body), y userId (Token)
   Llama a updateTicketStatusCommand.execute(...)
      |
      v
4. COMANDO CQRS (src/commands/tickets/UpdateTicketStatusCommand.js)
   Ejecuta las reglas de negocio de la HU-05:
      |-- Paso 4A: Busca el ticket con ticketRepository.findById(ticketId)
      |            - Si no existe: Lanza BusinessError(404)
      |
      |-- Paso 4B: Normaliza el estado con normalizeTicketStatus(newStatus)
      |            - Valida que no este cerrado ni sea igual al estado actual
      |
      |-- Paso 4C: Actualiza la tabla tickets via ticketRepository.updateStatus()
      |            - PPS-90: Coloca status = 'En revision' y actualiza fecha
      |
      |-- Paso 4D: Inserta en ticket_status_history via ticketRepository.recordStatusHistory()
      |            - PPS-90: Guarda ticketId, userId, previousStatus, newStatus, comment
      |
      `-- Paso 4E: Notifica al usuario creador via notificationService.notifyUser()
                   - PPS-91: Busca correo del creador y emite alerta de soporte tecnico
      |
      v
5. RESPUESTA (src/utils/responseBuilder.js)
   {
     "success": true,
     "message": "Estado del ticket actualizado exitosamente",
     "data": {
       "ticket": { "id": "...", "status": "En revision", ... },
       "previousStatus": "Abierto",
       "newStatus": "En revision",
       "creatorNotified": true
     }
   }
      |
      v
6. FLUTTER (Recibe respuesta)
   Actualiza el estado visual del ticket en la UI.
```

---

## 2. Desglose Tecnico por Archivo

### Paso 1: Enrutamiento y Seguridad
- **Archivo:** `src/routes/ticketRoutes.js`
- **Middlewares:**
  1. `authMiddleware`: decodifica el token Bearer.
  2. `roleCheck`: restringe a Administrador, Gerente y Soporte Tecnico.
  3. `updateTicketStatusValidator`: valida el formato de entrada.

### Paso 2: Controlador
- **Archivo:** `src/controllers/TicketCommandController.js`
- **Metodo:** `updateStatus(req, res, next)`

### Paso 3: Comando de Escritura
- **Archivo:** `src/commands/tickets/UpdateTicketStatusCommand.js`
- **Responsabilidad:** Asegurar la transicion valida de estados, registrar auditoria y disparar notificacion sin bloquear la operacion.

### Paso 4: Persistencia
- **Archivo:** `src/repositories/TicketRepository.js`
- **Metodos:** `findById`, `updateStatus`, `recordStatusHistory`

### Paso 5: Notificaciones
- **Archivo:** `src/services/NotificationService.js`
- **Metodo:** `notifyUser(creatorId, title, message)`
