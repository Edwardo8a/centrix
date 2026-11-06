const TicketStatus = require('../src/enums/TicketStatus');

describe('TicketStatus Enum', () => {
  it('debe retornar null si se pasa valor invalido a normalizeTicketStatus', () => {
    // Act & Assert
    expect(TicketStatus.normalizeTicketStatus(null)).toBeNull();
    expect(TicketStatus.normalizeTicketStatus(123)).toBeNull();
    expect(TicketStatus.normalizeTicketStatus('random_status')).toBeNull();
  });

  it('debe normalizar diferentes valores correctamente incluyendo Rechazado', () => {
    // Act & Assert
    expect(TicketStatus.normalizeTicketStatus(' ABIERTO ')).toBe(TicketStatus.ABIERTO);
    expect(TicketStatus.normalizeTicketStatus('en_revisión')).toBe(TicketStatus.EN_REVISION);
    expect(TicketStatus.normalizeTicketStatus('en progreso')).toBe(TicketStatus.EN_PROGRESO);
    expect(TicketStatus.normalizeTicketStatus('ReSuElTo')).toBe(TicketStatus.RESUELTO);
    expect(TicketStatus.normalizeTicketStatus('cerrado')).toBe(TicketStatus.CERRADO);
    expect(TicketStatus.normalizeTicketStatus('rechazado')).toBe(TicketStatus.RECHAZADO);
    expect(TicketStatus.normalizeTicketStatus('  ReChAzAdO  ')).toBe(TicketStatus.RECHAZADO);
  });
});
