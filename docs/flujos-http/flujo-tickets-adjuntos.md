# Flujo de Ejecucion HTTP End-to-End: Adjuntos en Tickets (Subida y Almacenamiento)

Este documento describe la ruta completa de extremo a extremo que recorre la peticion HTTP al adjuntar un archivo (evidencia, imagen, PDF) a un ticket existente desde Flutter hasta el almacenamiento en la nube y persistencia en base de datos.

---

## 1. Diagrama de la Ruta End-to-End

```text
========================================================================================
                                     FRONTEND (FLUTTER)
========================================================================================
1. INTERFAZ DE USUARIO (View)
   - Archivos:
     * `lib/features/tickets/presentation/views/ticket_detail_view.dart`
     * `lib/features/tickets/presentation/view_models/ticket_detail_view_model.dart`
   - El usuario pulsa "Agregar Evidencia / Adjunto".
   - `file_picker` o `image_picker` selecciona el archivo local del dispositivo.
   - Prepara una llamada HTTP `multipart/form-data`:
     headers: {
       'Authorization': 'Bearer <TOKEN_JWT>'
     }
     formData: {
       'file': MultipartFile.fromBytes(bytes, filename: 'captura_error.png')
     }
   - Realiza la peticion:
     client.post(Uri.parse('$baseUrl/api/tickets/$ticketId/attachments'), body: formData)
        |
        |  [HTTP POST /api/tickets/:id/attachments (multipart/form-data)]
        v
========================================================================================
                                     BACKEND (NODE.JS)
========================================================================================
2. ENRUTADOR Y MIDDLEWARES
   src/routes/ticketRoutes.js
   - Aplica en serie:
     |-- authMiddleware: Verifica token JWT
     |-- param('id').isUUID(): Valida que el ID del ticket sea UUID valido
     |-- upload.single('file'): Middleware Multer procesa el binario a buffer en memoria
     `-- validateResult: Valida parametros
        |
        v
3. CONTROLADOR
   src/controllers/TicketCommandController.js
   - Extrae el buffer, mimeType y nombre original de `req.file`.
   - Crea el command:
     const command = new AddTicketAttachmentCommand({
       ticketId: req.params.id,
       fileData: {
         buffer: req.file.buffer,
         mimetype: req.file.mimetype,
         originalname: req.file.originalname,
         size: req.file.size
       },
       userId: req.user.id
     });
   - Invoca: `addTicketAttachmentHandler.handle(command)`
        |
        v
4. HANDLER DE APLICACION (CQRS Write Side)
   src/commands/tickets/AddTicketAttachmentHandler.js
   - Verifica existencia del ticket y que no este en estado terminal.
   - Delega la subida y persistencia a `TicketRepository.addAttachment()`.
        |
        v
5. REPOSITORIO Y SUPABASE STORAGE
   src/repositories/TicketRepository.js
   - Sube el archivo al bucket de Supabase Storage:
     const path = `tickets/${ticketId}/${Date.now()}_${originalname}`;
     await this.supabase.storage.from('attachments').upload(path, buffer, ...);
   - Obtiene la URL publica:
     const { data: publicUrlData } = this.supabase.storage.from('attachments').getPublicUrl(path);
   - Inserta el registro en la tabla `ticket_attachments`:
     await this.supabase.from('ticket_attachments').insert({
       ticket_id: ticketId,
       file_url: publicUrlData.publicUrl,
       file_name: originalname,
       uploaded_by: userId
     });
        |
        v
6. RESPUESTA HTTP
   src/utils/responseBuilder.js
   - Retorna HTTP 201 Created:
     {
       "success": true,
       "message": "Archivo adjunto agregado exitosamente",
       "data": {
         "id": "uuid-adjunto",
         "ticket_id": "325cc46a-6a58-4d6a-a76b-911f13afd5c6",
         "file_url": "https://supabase.../attachments/tickets/.../captura_error.png",
         "created_at": "2026-11-12T15:30:00.000Z"
       }
     }
        |
        |  [HTTP 201 Created Response]
        v
========================================================================================
                               FRONTEND (PROCESAMIENTO)
========================================================================================
7. RENDERIZADO EN FLUTTER
   - `ticket_detail_view_model.dart` anade el nuevo adjunto a su lista local.
   - `ticket_detail_view.dart` actualiza la galeria/seccion de evidencias:
     * Si es imagen: la renderiza con `Image.network(file_url)`.
     * Si es documento: muestra icono con enlace para descargar o abrir externamente.
```

---

## 2. Archivos Involucrados

| Capa | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| View (Flutter) | `lib/features/tickets/presentation/views/ticket_detail_view.dart` | Selector de archivos y galeria visual |
| ViewModel (Flutter) | `lib/features/tickets/presentation/view_models/ticket_detail_view_model.dart` | Estado de carga de subida y refresco |
| Enrutador | `src/routes/ticketRoutes.js` | Multer + ruta POST |
| Controlador | `src/controllers/TicketCommandController.js` | Empaqueta datos a `AddTicketAttachmentCommand` |
| Handler | `src/commands/tickets/AddTicketAttachmentHandler.js` | Orquesta caso de uso de adjuntos |
| Repositorio | `src/repositories/TicketRepository.js` | Sube a Supabase Storage y persiste registro |
