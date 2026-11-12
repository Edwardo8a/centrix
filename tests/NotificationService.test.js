const notificationService = require('../src/services/NotificationService');
const { dataClient } = require('../src/config/supabaseClient');

jest.mock('../src/config/supabaseClient', () => {
  const mockFrom = jest.fn();
  return {
    dataClient: {
      from: mockFrom
    },
    adminClient: null
  };
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerDeviceToken', () => {
    it('debe arrojar error si faltan userId o fcmToken', async () => {
      await expect(notificationService.registerDeviceToken({ userId: null, fcmToken: 'token123' }))
        .rejects.toThrow('userId y fcmToken son requeridos');
      await expect(notificationService.registerDeviceToken({ userId: 'u1', fcmToken: null }))
        .rejects.toThrow('userId y fcmToken son requeridos');
    });

    it('debe realizar upsert en device_tokens', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'd1', fcm_token: 'token123' }, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockUpsert = jest.fn().mockReturnValue({ select: mockSelect });
      dataClient.from.mockReturnValue({ upsert: mockUpsert });

      const result = await notificationService.registerDeviceToken({
        userId: 'user-1',
        fcmToken: 'token123',
        platform: 'android',
        deviceName: 'Pixel 7'
      });

      expect(dataClient.from).toHaveBeenCalledWith('device_tokens');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          fcm_token: 'token123',
          platform: 'android',
          device_name: 'Pixel 7'
        }),
        { onConflict: 'user_id,fcm_token' }
      );
      expect(result).toEqual({ id: 'd1', fcm_token: 'token123' });
    });
  });

  describe('unregisterDeviceToken', () => {
    it('debe eliminar el token del dispositivo', async () => {
      const mockMatch = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ match: mockMatch });
      dataClient.from.mockReturnValue({ delete: mockDelete });

      await notificationService.unregisterDeviceToken({
        userId: 'user-1',
        fcmToken: 'token123'
      });

      expect(dataClient.from).toHaveBeenCalledWith('device_tokens');
      expect(mockMatch).toHaveBeenCalledWith({ user_id: 'user-1', fcm_token: 'token123' });
    });
  });

  describe('getUserNotifications', () => {
    it('debe retornar la lista de notificaciones ordenadas por fecha', async () => {
      const mockRange = jest.fn().mockResolvedValue({ data: [{ id: 'n1', title: 'Aviso' }], error: null });
      const mockOrder = jest.fn().mockReturnValue({ range: mockRange });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      dataClient.from.mockReturnValue({ select: mockSelect });

      const result = await notificationService.getUserNotifications({
        userId: 'user-1',
        limit: 10,
        offset: 0
      });

      expect(dataClient.from).toHaveBeenCalledWith('notifications');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('debe actualizar is_read a true', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'n1', is_read: true }, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockMatch = jest.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = jest.fn().mockReturnValue({ match: mockMatch });
      dataClient.from.mockReturnValue({ update: mockUpdate });

      const result = await notificationService.markAsRead({
        userId: 'user-1',
        notificationId: 'n1'
      });

      expect(dataClient.from).toHaveBeenCalledWith('notifications');
      expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
      expect(mockMatch).toHaveBeenCalledWith({ id: 'n1', user_id: 'user-1' });
      expect(result.is_read).toBe(true);
    });
  });
});
