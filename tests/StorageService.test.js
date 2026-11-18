const StorageService = require('../src/services/StorageService');

describe('StorageService', () => {
  let mockStorageClient;
  let service;

  beforeEach(() => {
    mockStorageClient = {
      storage: {
        from: jest.fn()
      }
    };
    service = new StorageService({
      storageClient: mockStorageClient,
      bucketName: 'ticket-attachments',
      supabaseUrl: 'https://placeholder.supabase.co',
      signedUrlExpiresIn: 3600
    });
  });

  it('debe retornar [] si el arreglo de adjuntos está vacío o no es un arreglo', async () => {
    expect(await service.createSignedUrlsForAttachments([])).toEqual([]);
    expect(await service.createSignedUrlsForAttachments(null)).toEqual([]);
    expect(mockStorageClient.storage.from).not.toHaveBeenCalled();
  });

  it('debe ordenar por created_at ASC y firmar URLs válidas con createSignedUrls', async () => {
    const rawAttachments = [
      {
        id: 'att-2',
        file_url: 'ticket-attachments/t-1/doc.pdf',
        file_format: 'pdf',
        size_bytes: 45000,
        created_at: '2026-11-03T12:11:00Z'
      },
      {
        id: 'att-1',
        file_url: 'ticket-attachments/t-1/foto1.png',
        file_format: 'png',
        size_bytes: 12000,
        created_at: '2026-11-03T12:10:00Z'
      }
    ];

    const createSignedUrlsMock = jest.fn().mockResolvedValue({
      data: [
        { path: 't-1/foto1.png', signedUrl: 'https://signed.example.com/foto1.png' },
        { path: 't-1/doc.pdf', signedUrl: 'https://signed.example.com/doc.pdf' }
      ],
      error: null
    });
    mockStorageClient.storage.from.mockReturnValue({ createSignedUrls: createSignedUrlsMock });

    const result = await service.createSignedUrlsForAttachments(rawAttachments);

    expect(mockStorageClient.storage.from).toHaveBeenCalledWith('ticket-attachments');
    expect(createSignedUrlsMock).toHaveBeenCalledWith(['t-1/foto1.png', 't-1/doc.pdf'], 3600);
    expect(result).toEqual([
      {
        id: 'att-1',
        fileFormat: 'png',
        sizeBytes: 12000,
        createdAtIso: '2026-11-03T12:10:00Z',
        signedUrl: 'https://signed.example.com/foto1.png'
      },
      {
        id: 'att-2',
        fileFormat: 'pdf',
        sizeBytes: 45000,
        createdAtIso: '2026-11-03T12:11:00Z',
        signedUrl: 'https://signed.example.com/doc.pdf'
      }
    ]);
  });

  it('debe manejar errores al generar signedUrls retornando signedUrl en null sin fallar', async () => {
    const rawAttachments = [
      {
        id: 'att-1',
        file_url: 'ticket-attachments/t-1/foto1.png',
        file_format: 'png',
        size_bytes: 12000,
        created_at: '2026-11-03T12:10:00Z'
      }
    ];

    const createSignedUrlsMock = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('Storage error')
    });
    mockStorageClient.storage.from.mockReturnValue({ createSignedUrls: createSignedUrlsMock });

    const result = await service.createSignedUrlsForAttachments(rawAttachments);

    expect(result[0].signedUrl).toBeNull();
  });
});
