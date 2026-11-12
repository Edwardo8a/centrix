const fs = require('fs');
const path = require('path');
const { initializeApp, getApps, cert } = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const { dataClient, adminClient } = require('../config/supabaseClient');

const credentialsPath = path.join(__dirname, '../config/firebase-credentials.json');

let isFirebaseInitialized = false;
let messagingInstance = null;

if (fs.existsSync(credentialsPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const apps = getApps();
    const app = apps.length > 0
      ? apps[0]
      : initializeApp({ credential: cert(serviceAccount) });

    messagingInstance = getMessaging(app);
    isFirebaseInitialized = true;
    console.log('[NotificationService] Firebase Admin y Messaging inicializados correctamente.');
  } catch (err) {
    console.warn('[NotificationService] Error inicializando Firebase Admin:', err.message);
  }
} else {
  console.warn('[NotificationService] firebase-credentials.json no encontrado. Notificaciones push desactivadas.');
}

const getDb = () => adminClient || dataClient;

class NotificationService {
  /**
   * Registra o actualiza el token FCM de un dispositivo para un usuario
   */
  async registerDeviceToken({ userId, fcmToken, platform = 'android', deviceName = null }) {
    if (!userId || !fcmToken) {
      throw new Error('userId y fcmToken son requeridos');
    }

    const db = getDb();
    const { data, error } = await db
      .from('device_tokens')
      .upsert(
        {
          user_id: userId,
          fcm_token: fcmToken,
          platform,
          device_name: deviceName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,fcm_token' }
      )
      .select()
      .single();

    if (error) {
      console.error('[NotificationService] Error guardando device_token:', error.message);
      throw error;
    }
    return data;
  }

  /**
   * Elimina un token al cerrar sesión
   */
  async unregisterDeviceToken({ userId, fcmToken }) {
    const db = getDb();
    const { error } = await db
      .from('device_tokens')
      .delete()
      .match({ user_id: userId, fcm_token: fcmToken });

    if (error) {
      console.error('[NotificationService] Error eliminando device_token:', error.message);
      throw error;
    }
  }

  /**
   * Guarda una notificación en la base de datos y envía el push si tiene dispositivos registrados
   */
  async sendNotificationToUser({ userId, ticketId = null, title, body, type = 'general', data = {} }) {
    if (!userId || !title || !body) {
      return;
    }

    const db = getDb();

    // 1. Guardar en public.notifications (para la campana / realtime in-app)
    try {
      await db.from('notifications').insert({
        user_id: userId,
        ticket_id: ticketId,
        title,
        body,
        type,
        data,
      });
    } catch (dbErr) {
      console.error('[NotificationService] Error insertando en tabla notifications:', dbErr.message);
    }

    // 2. Si Firebase no está listo, no podemos enviar push
    if (!isFirebaseInitialized || !messagingInstance) {
      return;
    }

    // 3. Consultar los device_tokens del usuario
    const { data: devices, error: devErr } = await db
      .from('device_tokens')
      .select('fcm_token')
      .eq('user_id', userId);

    if (devErr || !devices || devices.length === 0) {
      return;
    }

    const tokens = devices.map((d) => d.fcm_token).filter(Boolean);
    if (tokens.length === 0) {
      return;
    }

    // Convertir todos los campos de data a string (exigencia de Firebase)
    const payloadData = {};
    for (const [k, v] of Object.entries(data || {})) {
      payloadData[k] = String(v);
    }
    if (ticketId) {
      payloadData.ticket_id = String(ticketId);
    }
    payloadData.type = String(type);

    const message = {
      notification: {
        title,
        body,
      },
      data: payloadData,
      tokens,
    };

    try {
      const response = await messagingInstance.sendEachForMulticast(message);

      // Limpieza de tokens inválidos o desinstalados
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          await db
            .from('device_tokens')
            .delete()
            .in('fcm_token', invalidTokens);
          console.log(`[NotificationService] Se eliminaron ${invalidTokens.length} tokens expirados.`);
        }
      }
    } catch (pushErr) {
      console.error('[NotificationService] Error enviando multicast FCM:', pushErr.message);
    }
  }

  /**
   * Consulta las notificaciones de un usuario para la campana in-app
   */
  async getUserNotifications({ userId, limit = 20, offset = 0 }) {
    const db = getDb();
    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[NotificationService] Error consultando notificaciones:', error.message);
      throw error;
    }
    return data || [];
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead({ userId, notificationId }) {
    const db = getDb();
    const { data, error } = await db
      .from('notifications')
      .update({ is_read: true })
      .match({ id: notificationId, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('[NotificationService] Error marcando como leída:', error.message);
      throw error;
    }
    return data;
  }
}

module.exports = new NotificationService();
