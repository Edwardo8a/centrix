class NotificationService {
  async sendEmail(to, subject, body) {
    console.log(`[NotificationService] Sending email to ${to}: ${subject}`);
    return true;
  }
}

module.exports = NotificationService;
