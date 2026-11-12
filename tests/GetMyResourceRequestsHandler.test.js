const GetMyResourceRequestsHandler = require('../src/queries/resource-requests/GetMyResourceRequestsHandler');
const GetMyResourceRequestsQuery = require('../src/queries/resource-requests/GetMyResourceRequestsQuery');

describe('GetMyResourceRequestsHandler', () => {
  let mockResourceRequestReadModel;
  let handler;

  const mockRequests = [
    {
      id: 'rr-001',
      title: 'Silla ergonómica',
      category: 'Mobiliario',
      status: 'Pendiente',
      createdAt: '2026-11-01T10:00:00Z'
    },
    {
      id: 'rr-002',
      title: 'Resmas de papel',
      category: 'Papeleria',
      status: 'Aprobada',
      createdAt: '2026-11-02T12:00:00Z'
    }
  ];

  beforeEach(() => {
    mockResourceRequestReadModel = {
      getRequestsByCreator: jest.fn()
    };
    handler = new GetMyResourceRequestsHandler({ resourceRequestReadModel: mockResourceRequestReadModel });
  });

  it('debe retornar la lista de solicitudes del usuario', async () => {
    mockResourceRequestReadModel.getRequestsByCreator.mockResolvedValue(mockRequests);

    const query = new GetMyResourceRequestsQuery({ userId: 'user-001' });
    const result = await handler.handle(query);

    expect(result).toEqual(mockRequests);
    expect(mockResourceRequestReadModel.getRequestsByCreator).toHaveBeenCalledWith('user-001');
    expect(mockResourceRequestReadModel.getRequestsByCreator).toHaveBeenCalledTimes(1);
  });

  it('debe retornar un arreglo vacío si el usuario no tiene solicitudes', async () => {
    mockResourceRequestReadModel.getRequestsByCreator.mockResolvedValue([]);

    const query = new GetMyResourceRequestsQuery({ userId: 'user-sin-solicitudes' });
    const result = await handler.handle(query);

    expect(result).toEqual([]);
    expect(mockResourceRequestReadModel.getRequestsByCreator).toHaveBeenCalledWith('user-sin-solicitudes');
  });
});
