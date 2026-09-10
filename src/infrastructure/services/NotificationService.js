class NotificationService {
  async sendEmail(to, subject, body) {
    console.log(`[NotificationService] Sending email to ${to}: ${subject}`);
    return true;
  }

  async notifyUser(userId, title, message) {
    console.log(`[NotificationService] Notifying user ${userId}: ${title} - ${message}`);
    return true;
  }
}

module.exports = NotificationService;
