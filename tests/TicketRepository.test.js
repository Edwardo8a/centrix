const TicketRepository = require('../src/repositories/TicketRepository');

describe('TicketRepository', () => {
  let mockSupabase;
  let repository;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn()
    };
    repository = new TicketRepository({ supabase: mockSupabase });
  });

  describe('create', () => {
    it('debe insertar un ticket y retornar el id', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: { id: 't-1' }, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const ticketData = {
        title: 'Falla',
        description: 'Detalle',
        priority: 'Alta',
        status: 'Abierto',
        department_id: 'dept-1',
        created_by: 'u-1'
      };

      const result = await repository.create(ticketData);

      expect(result).toEqual({ id: 't-1' });
      expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
    });

    it('debe lanzar error si supabase falla en create', async () => {
      const errorMock = new Error('Database connection failed');
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: errorMock });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      await expect(repository.create({})).rejects.toThrow('Database connection failed');
    });
  });

  describe('findById', () => {
    it('debe buscar el ticket por id ignorando eliminados', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: { id: 't-1', title: 'Ticket 1', status: 'Abierto' },
        error: null
      });
      const isMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await repository.findById('t-1');

      expect(result).toEqual({ id: 't-1', title: 'Ticket 1', status: 'Abierto' });
      expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(eqMock).toHaveBeenCalledWith('id', 't-1');
      expect(isMock).toHaveBeenCalledWith('deleted_at', null);
    });

    it('debe lanzar error si supabase falla en findById', async () => {
      const dbError = new Error('Query error');
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: dbError });
      const isMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(repository.findById('t-1')).rejects.toThrow('Query error');
    });
  });

  describe('softDelete', () => {
    it('debe fijar deleted_at y deleted_by en el ticket', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: { id: 't-1' },
        error: null
      });
      const selectMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const isMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      const result = await repository.softDelete('t-1', 'u-admin');

      expect(result).toEqual({ id: 't-1' });
      expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_by: 'u-admin',
          deleted_at: expect.any(String)
        })
      );
      expect(eqMock).toHaveBeenCalledWith('id', 't-1');
      expect(isMock).toHaveBeenCalledWith('deleted_at', null);
    });

    it('debe lanzar error si supabase falla en softDelete', async () => {
      const dbError = new Error('Soft delete error');
      const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: dbError });
      const selectMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const isMock = jest.fn().mockReturnValue({ select: selectMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ update: updateMock });

      await expect(repository.softDelete('t-1', 'u-admin')).rejects.toThrow('Soft delete error');
    });
  });

  describe('updateStatus', () => {
    it('debe llamar a la función RPC transaccional con los parámetros correctos', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { id: 't-1', previousStatus: 'Abierto', status: 'En revision' },
        error: null
      });

      const result = await repository.updateStatus({
        ticketId: 't-1',
        userId: 'u-1',
        newStatus: 'En revision',
        previousStatus: 'Abierto',
        comment: 'Comentario'
      });

      expect(result).toEqual({ id: 't-1', previousStatus: 'Abierto', status: 'En revision' });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_ticket_status_transactional', {
        p_ticket_id: 't-1',
        p_user_id: 'u-1',
        p_new_status: 'En revision',
        p_expected_status: 'Abierto',
        p_comment: 'Comentario'
      });
    });

    it('debe traducir error P0002 a BusinessError 404', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { code: 'P0002', message: 'Ticket no encontrado o eliminado' }
      });

      await expect(
        repository.updateStatus({
          ticketId: 't-1',
          userId: 'u-1',
          newStatus: 'En revision',
          previousStatus: 'Abierto',
          comment: null
        })
      ).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'Ticket no encontrado',
        statusCode: 404
      });
    });

    it('debe traducir error P0003 a BusinessError 409', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { code: 'P0003', message: 'El ticket cambio de estado' }
      });

      await expect(
        repository.updateStatus({
          ticketId: 't-1',
          userId: 'u-1',
          newStatus: 'En revision',
          previousStatus: 'Abierto',
          comment: null
        })
      ).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'El ticket cambió de estado, vuelve a intentarlo',
        statusCode: 409
      });
    });

    it('debe relanzar otros errores no controlados de la base de datos', async () => {
      const dbError = new Error('Fatal DB Error');
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: dbError
      });

      await expect(
        repository.updateStatus({
          ticketId: 't-1',
          userId: 'u-1',
          newStatus: 'En revision',
          previousStatus: 'Abierto',
          comment: null
        })
      ).rejects.toThrow('Fatal DB Error');
    });
  });

  describe('assign', () => {
    it('debe llamar a la función RPC assign_ticket_transactional con los parámetros correctos', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { id: 't-1' },
        error: null
      });

      const result = await repository.assign({
        ticketId: 't-1',
        assignedTo: 'u-tech',
        userId: 'u-gerente',
        comment: 'Ticket asignado a Carlos (u-tech)'
      });

      expect(result).toEqual({ id: 't-1' });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('assign_ticket_transactional', {
        p_ticket_id: 't-1',
        p_assigned_to: 'u-tech',
        p_user_id: 'u-gerente',
        p_comment: 'Ticket asignado a Carlos (u-tech)'
      });
    });

    it('debe traducir error P0002 en assign a BusinessError 404', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { code: 'P0002', message: 'Ticket no encontrado o eliminado' }
      });

      await expect(
        repository.assign({
          ticketId: 't-1',
          assignedTo: 'u-tech',
          userId: 'u-gerente',
          comment: 'Asignación'
        })
      ).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'Ticket no encontrado',
        statusCode: 404
      });
    });

    it('debe traducir error P0003 en assign a BusinessError 409', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { code: 'P0003', message: 'El ticket ya se encuentra asignado a este usuario' }
      });

      await expect(
        repository.assign({
          ticketId: 't-1',
          assignedTo: 'u-tech',
          userId: 'u-gerente',
          comment: 'Asignación'
        })
      ).rejects.toMatchObject({
        name: 'BusinessError',
        message: 'El ticket ya se encuentra asignado a este usuario',
        statusCode: 409
      });
    });

    it('debe relanzar errores inesperados de base de datos en assign', async () => {
      const dbError = new Error('Unexpected RPC error');
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: dbError
      });

      await expect(
        repository.assign({
          ticketId: 't-1',
          assignedTo: 'u-tech',
          userId: 'u-gerente',
          comment: 'Asignación'
        })
      ).rejects.toThrow('Unexpected RPC error');
    });
  });

  describe('addAttachment', () => {
    it('debe insertar una fila en ticket_attachments y retornar { id }', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: { id: 'att-1' }, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      const result = await repository.addAttachment({
        ticketId: 't-1',
        fileUrl: 'ticket-attachments/t-1/evidencia.png',
        fileFormat: 'png',
        sizeBytes: 2048
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ticket_attachments');
      expect(insertMock).toHaveBeenCalledWith({
        ticket_id: 't-1',
        file_url: 'ticket-attachments/t-1/evidencia.png',
        file_format: 'png',
        size_bytes: 2048
      });
      expect(result).toEqual({ id: 'att-1' });
    });

    it('debe relanzar el error si supabase falla en addAttachment', async () => {
      const dbError = new Error('Attachment insert error');
      const singleMock = jest.fn().mockResolvedValue({ data: null, error: dbError });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      mockSupabase.from.mockReturnValue({ insert: insertMock });

      await expect(
        repository.addAttachment({
          ticketId: 't-1',
          fileUrl: 'ticket-attachments/t-1/evidencia.png',
          fileFormat: 'png',
          sizeBytes: 2048
        })
      ).rejects.toThrow('Attachment insert error');
    });
  });
});
