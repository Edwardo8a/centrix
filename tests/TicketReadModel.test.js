const TicketReadModel = require('../src/repositories/TicketReadModel');

describe('TicketReadModel', () => {
  let mockSupabase;
  let mockStorageClient;
  let readModel;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn()
    };
    mockStorageClient = {
      storage: {
        from: jest.fn()
      }
    };
    readModel = new TicketReadModel({
      supabase: mockSupabase,
      storageClient: mockStorageClient,
      bucketName: 'ticket-attachments',
      supabaseUrl: 'https://placeholder.supabase.co',
      signedUrlExpiresIn: 3600
    });
  });

  describe('getTicketsByCreator', () => {
    it('debe filtrar por created_by = userId, deleted_at IS NULL y ordenar por created_at DESC', async () => {
      const rawRows = [
        {
          id: 't-2',
          title: 'Ticket Reciente',
          description: 'Desc 2',
          priority: 'Alta',
          status: 'Abierto',
          department_id: 'dept-1',
          created_at: '2026-11-03T12:00:00Z',
          creator: { id: 'u-saori', full_name: 'Saori' },
          assignee: null
        },
        {
          id: 't-1',
          title: 'Ticket Antiguo',
          description: 'Desc 1',
          priority: 'Baja',
          status: 'En revision',
          department_id: 'dept-1',
          created_at: '2026-11-02T10:00:00Z',
          creator: { id: 'u-saori', full_name: 'Saori' },
          assignee: { id: 'u-tech', full_name: 'Soporte 1' }
        }
      ];

      const orderMock = jest.fn().mockResolvedValue({ data: rawRows, error: null });
      const isMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await readModel.getTicketsByCreator('u-saori');

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
      expect(eqMock).toHaveBeenCalledWith('created_by', 'u-saori');
      expect(isMock).toHaveBeenCalledWith('deleted_at', null);
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual([
        {
          ticketId: 't-2',
          title: 'Ticket Reciente',
          description: 'Desc 2',
          priority: 'Alta',
          status: 'Abierto',
          departmentId: 'dept-1',
          createdAtIso: '2026-11-03T12:00:00Z',
          authorName: 'Saori',
          assignedToName: 'Sin asignar'
        },
        {
          ticketId: 't-1',
          title: 'Ticket Antiguo',
          description: 'Desc 1',
          priority: 'Baja',
          status: 'En revision',
          departmentId: 'dept-1',
          createdAtIso: '2026-11-02T10:00:00Z',
          authorName: 'Saori',
          assignedToName: 'Soporte 1'
        }
      ]);
    });

    it('debe relanzar el error si Supabase falla en getTicketsByCreator', async () => {
      const dbError = new Error('DB Read error');
      const orderMock = jest.fn().mockResolvedValue({ data: null, error: dbError });
      const isMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(readModel.getTicketsByCreator('u-saori')).rejects.toThrow('DB Read error');
    });
  });

  describe('getTicketsByAssignee', () => {
    it('debe filtrar por assigned_to = userId, deleted_at IS NULL y ordenar por created_at DESC', async () => {
      const rawRows = [
        {
          id: 't-assigned-1',
          title: 'Ticket Asignado',
          description: 'Resolver red',
          priority: 'Alta',
          status: 'En progreso',
          department_id: 'dept-1',
          created_at: '2026-11-03T13:00:00Z',
          creator: { id: 'u-saori', full_name: 'Saori' },
          assignee: { id: 'u-tech', full_name: 'Carlos Soporte' }
        }
      ];

      const orderMock = jest.fn().mockResolvedValue({ data: rawRows, error: null });
      const isMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const result = await readModel.getTicketsByAssignee('u-tech');

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
      expect(eqMock).toHaveBeenCalledWith('assigned_to', 'u-tech');
      expect(isMock).toHaveBeenCalledWith('deleted_at', null);
      expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual([
        {
          ticketId: 't-assigned-1',
          title: 'Ticket Asignado',
          description: 'Resolver red',
          priority: 'Alta',
          status: 'En progreso',
          departmentId: 'dept-1',
          createdAtIso: '2026-11-03T13:00:00Z',
          authorName: 'Saori',
          assignedToName: 'Carlos Soporte'
        }
      ]);
    });

    it('debe relanzar el error si Supabase falla en getTicketsByAssignee', async () => {
      const dbError = new Error('DB Assigned Read error');
      const orderMock = jest.fn().mockResolvedValue({ data: null, error: dbError });
      const isMock = jest.fn().mockReturnValue({ order: orderMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      await expect(readModel.getTicketsByAssignee('u-tech')).rejects.toThrow('DB Assigned Read error');
    });
  });

  describe('getAllTickets', () => {
    it('debe filtrar deleted_at IS NULL, aplicar filtros opcionales, ordenar por created_at DESC y paginar con range', async () => {
      const rawRows = [
        {
          id: 't-global-1',
          title: 'Ticket Global 1',
          description: 'Descripción',
          priority: 'Alta',
          status: 'Rechazado',
          department_id: 'dept-1',
          created_at: '2026-11-03T14:00:00Z',
          creator: { id: 'u-saori', full_name: 'Saori' },
          assignee: null
        }
      ];

      const builder = {
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: rawRows, error: null, count: 25 })
      };
      mockSupabase.from.mockReturnValue(builder);

      const result = await readModel.getAllTickets({
        status: 'Rechazado',
        departmentId: 'dept-1',
        priority: 'Alta',
        page: 2,
        limit: 10
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('tickets');
      expect(builder.select).toHaveBeenCalledWith(expect.any(String), { count: 'exact' });
      expect(builder.is).toHaveBeenCalledWith('deleted_at', null);
      expect(builder.eq).toHaveBeenCalledWith('status', 'Rechazado');
      expect(builder.eq).toHaveBeenCalledWith('department_id', 'dept-1');
      expect(builder.eq).toHaveBeenCalledWith('priority', 'Alta');
      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(builder.range).toHaveBeenCalledWith(10, 19);
      expect(result).toEqual({
        items: [
          {
            ticketId: 't-global-1',
            title: 'Ticket Global 1',
            description: 'Descripción',
            priority: 'Alta',
            status: 'Rechazado',
            departmentId: 'dept-1',
            createdAtIso: '2026-11-03T14:00:00Z',
            authorName: 'Saori',
            assignedToName: 'Sin asignar'
          }
        ],
        pagination: {
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3
        }
      });
    });

    it('debe relanzar el error si Supabase falla en getAllTickets', async () => {
      const dbError = new Error('DB Global Read error');
      const builder = {
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: dbError, count: null })
      };
      mockSupabase.from.mockReturnValue(builder);

      await expect(readModel.getAllTickets()).rejects.toThrow('DB Global Read error');
    });
  });

  describe('getTicketById & getAttachmentsWithSignedUrls', () => {
    it('debe mapear el detalle del ticket cuando existe y retornar null cuando no', async () => {
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: {
          id: 't-1',
          title: 'Falla',
          description: 'Detalle',
          priority: 'Alta',
          status: 'Resuelto',
          department_id: 'dept-1',
          created_by: 'u-saori',
          assigned_to: 'u-tech',
          resolution_notes: 'Solucionado',
          resolved_at: '2026-11-03T15:00:00Z',
          created_at: '2026-11-03T12:00:00Z',
          updated_at: '2026-11-03T15:00:00Z',
          creator: { id: 'u-saori', full_name: 'Saori' },
          assignee: { id: 'u-tech', full_name: 'Carlos Soporte' }
        },
        error: null
      });
      const isMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
      const eqMock = jest.fn().mockReturnValue({ is: isMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const detail = await readModel.getTicketById('t-1');
      expect(detail).toEqual({
        ticketId: 't-1',
        title: 'Falla',
        description: 'Detalle',
        priority: 'Alta',
        status: 'Resuelto',
        departmentId: 'dept-1',
        createdBy: 'u-saori',
        assignedTo: 'u-tech',
        resolutionNotes: 'Solucionado',
        resolvedAtIso: '2026-11-03T15:00:00Z',
        createdAtIso: '2026-11-03T12:00:00Z',
        updatedAtIso: '2026-11-03T15:00:00Z',
        authorName: 'Saori',
        assignedToName: 'Carlos Soporte'
      });

      maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
      const missing = await readModel.getTicketById('t-none');
      expect(missing).toBeNull();
    });

    it('debe consultar ticket_attachments y generar URLs firmadas en lote con createSignedUrls', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'att-1',
            file_url: 'ticket-attachments/t-1/foto1.png',
            file_format: 'png',
            size_bytes: 12000,
            created_at: '2026-11-03T12:10:00Z'
          },
          {
            id: 'att-2',
            file_url: 'https://placeholder.supabase.co/storage/v1/object/authenticated/ticket-attachments/t-1/doc.pdf',
            file_format: 'pdf',
            size_bytes: 45000,
            created_at: '2026-11-03T12:11:00Z'
          }
        ],
        error: null
      });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockSupabase.from.mockReturnValue({ select: selectMock });

      const createSignedUrlsMock = jest.fn().mockResolvedValue({
        data: [
          { path: 't-1/foto1.png', signedUrl: 'https://signed.example.com/foto1.png?token=1' },
          { path: 't-1/doc.pdf', signedUrl: 'https://signed.example.com/doc.pdf?token=2' }
        ],
        error: null
      });
      mockStorageClient.storage.from.mockReturnValue({ createSignedUrls: createSignedUrlsMock });

      const result = await readModel.getAttachmentsWithSignedUrls('t-1');

      expect(mockStorageClient.storage.from).toHaveBeenCalledWith('ticket-attachments');
      expect(createSignedUrlsMock).toHaveBeenCalledWith(['t-1/foto1.png', 't-1/doc.pdf'], 3600);
      expect(result).toEqual([
        {
          id: 'att-1',
          fileFormat: 'png',
          sizeBytes: 12000,
          createdAtIso: '2026-11-03T12:10:00Z',
          signedUrl: 'https://signed.example.com/foto1.png?token=1'
        },
        {
          id: 'att-2',
          fileFormat: 'pdf',
          sizeBytes: 45000,
          createdAtIso: '2026-11-03T12:11:00Z',
          signedUrl: 'https://signed.example.com/doc.pdf?token=2'
        }
      ]);
    });
  });
});
