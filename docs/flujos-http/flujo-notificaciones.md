# Flujo de Ejecucion HTTP End-to-End: Notificaciones Push y en App

Este documento describe la ruta completa que recorre la aplicacion Flutter y el Backend Node.js para:
1. El registro del token FCM al iniciar sesion.
2. La recepcion y listado de notificaciones en la campana/panel de notificaciones.
3. El marcado de notificaciones como leidas.

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. INICIALIZACION Y REGISTRO DE TOKEN (View / ViewModel)
   - Archivos:
     * `lib/features/notifications/presentation/view_models/notification_view_model.dart`
     * `lib/features/auth/presentation/views/login_view.dart`
   - Tras login exitoso, Firebase Messaging obtiene el token del dispositivo:
     final fcmToken = await FirebaseMessaging.instance.getToken();
   - Llama a `POST /api/users/device-token`:
     headers: { 'Authorization': 'Bearer <TOKEN_JWT>', 'Content-Type': 'application/json' }
     body: jsonEncode({ 'token': fcmToken })
        |
        |  [HTTP POST /api/users/device-token]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. REGISTRO DEL DISPOSITIVO
   src/routes/userRoutes.js -> NotificationService.js
   - Valida el token no vacio.
   - Guarda o actualiza el registro en `user_device_tokens` en Supabase asociando:
     (user_id, token, platform: 'fcm', updated_at: NOW()).
        |
        v
3. EVENTO DEL SISTEMA (Ej: Cambio de estado o Asignacion)
   - Un Gerente asigna un ticket o Soporte cambia estado.
   - `ChangeTicketStatusHandler` o `AssignTicketHandler` llaman a:
     `notificationService.sendNotification({ userId, title, body, data })`
   - Accion dual de `NotificationService`:
     1. Inserta en la tabla `notifications` (notificacion in-app con `read = false`).
     2. Envia push message via Firebase Admin SDK a todos los `device_tokens` del usuario.
        |
        |  [Push Notification enviada por Google FCM]
        v
========================================================================================
                               FRONTEND (RECEPCION PUSH)
========================================================================================
4. RECEPCION EN DISPOSITIVO (Flutter)
   - `FirebaseMessaging.onMessage`: Si la app esta abierta, muestra un SnackBar o banner.
   - `FirebaseMessaging.onMessageOpenedApp`: Si el usuario toca la alerta en la barra
     del sistema, navega a `ticket_detail_view.dart` usando `data['ticket_id']`.
        |
        v
========================================================================================
                      CONSULTA Y MARCADO EN APP (BANDEJA / CAMPANA)
========================================================================================
5. CONSULTA DE NOTIFICACIONES
   - El usuario abre el panel de notificaciones en Flutter.
   - `notification_view_model.dart` llama a:
     GET /api/notifications?limit=20&offset=0
   - `NotificationController.js` consulta la tabla `notifications` filtrada por `user_id`.
   - Flutter renderiza la lista con indicador visual de no leidas (`read == false`).

6. MARCAR COMO LEIDA
   - El usuario toca la notificacion.
   - Flutter llama a:
     PATCH /api/notifications/:id/read
   - `NotificationController.js` actualiza `read = true` en Supabase.
   - Flutter actualiza el contador de la campana en el header (`centrix_page_header.dart`).
```

---

## 2. Archivos Involucrados

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| View / Header (Flutter) | `lib/features/dashboard/presentation/views/dashboard_view.dart`<br>`centrix_page_header.dart` | Campana de notificaciones y badge de conteo |
| ViewModel (Flutter) | `lib/features/notifications/presentation/view_models/notification_view_model.dart` | Carga, marcado y escucha de FCM |
| Rutas Backend | `src/routes/userRoutes.js`<br>`src/routes/notificationRoutes.js` | Enrutamiento de tokens y notificaciones |
| Controlador Backend | `src/controllers/NotificationController.js` | Handlers Express para listado y lectura |
| Servicio Transversal | `src/services/NotificationService.js` | Envio de push con Firebase y guardado en Supabase |
