const supabase = require('../db/supabaseClient');

// Servicio de notificaciones internas y envio de correos electronicos
class NotificationService {
  // Envio de correo electronico simulado o integrado
  async sendEmail(to, subject, body) {
    console.log(`[NotificationService] Envio de correo a ${to}: ${subject} - ${body}`);
    return true;
  }

  // Notifica a un usuario especifico sobre actualizaciones de su ticket
  async notifyUser(userId, title, message) {
    console.log(`[NotificationService] Notificacion para usuario ${userId}: ${title} - ${message}`);

    // Intentar obtener el correo electronico del usuario creador para notificarlo
    try {
      let userEmail = null;

      // Consulta en la tabla users
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (user && user.email) {
        userEmail = user.email;
      }

      // Si existe correo, se ejecuta el envio
      if (userEmail) {
        await this.sendEmail(userEmail, title, message);
      }
    } catch (err) {
      console.warn('[NotificationService] No se pudo obtener el correo para notificar:', err.message);
    }

    return {
      userId,
      title,
      message,
      delivered: true,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = NotificationService;
