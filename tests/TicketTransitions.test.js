const {
  TicketStatus,
  ALLOWED_STATUS_TRANSITIONS,
  isValidTransition
} = require('../src/enums/TicketStatus');

describe('Ticket Transitions Matrix', () => {
  describe('Definición de matriz ALLOWED_STATUS_TRANSITIONS', () => {
    it('debe tener definidos los 6 estados en la matriz (incluyendo Rechazado)', () => {
      expect(ALLOWED_STATUS_TRANSITIONS).toHaveProperty(TicketStatus.ABIERTO);
      expect(ALLOWED_STATUS_TRANSITIONS).toHaveProperty(TicketStatus.EN_REVISION);
      expect(ALLOWED_STATUS_TRANSITIONS).toHaveProperty(TicketStatus.EN_PROGRESO);
      expect(ALLOWED_STATUS_TRANSITIONS).toHaveProperty(TicketStatus.RESUELTO);
      expect(ALLOWED_STATUS_TRANSITIONS).toHaveProperty(TicketStatus.CERRADO);
      expect(ALLOWED_STATUS_TRANSITIONS).toHaveProperty(TicketStatus.RECHAZADO);
    });

    it('debe contener las transiciones válidas para Abierto (incluyendo Rechazado)', () => {
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.ABIERTO]).toEqual([
        TicketStatus.EN_REVISION,
        TicketStatus.EN_PROGRESO,
        TicketStatus.CERRADO,
        TicketStatus.RECHAZADO
      ]);
    });

    it('debe contener las transiciones válidas para En revision (incluyendo Rechazado)', () => {
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.EN_REVISION]).toEqual([
        TicketStatus.EN_PROGRESO,
        TicketStatus.RESUELTO,
        TicketStatus.CERRADO,
        TicketStatus.RECHAZADO
      ]);
    });

    it('debe contener las transiciones válidas para En progreso (sin Rechazado)', () => {
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.EN_PROGRESO]).toEqual([
        TicketStatus.EN_REVISION,
        TicketStatus.RESUELTO,
        TicketStatus.CERRADO
      ]);
    });

    it('debe contener las transiciones válidas para Resuelto (sin Rechazado)', () => {
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.RESUELTO]).toEqual([
        TicketStatus.EN_PROGRESO,
        TicketStatus.CERRADO
      ]);
    });

    it('debe definir Cerrado y Rechazado como estados terminales sin transiciones', () => {
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.CERRADO]).toEqual([]);
      expect(ALLOWED_STATUS_TRANSITIONS[TicketStatus.RECHAZADO]).toEqual([]);
    });
  });

  describe('isValidTransition helper', () => {
    it('debe validar transiciones permitidas desde Abierto', () => {
      expect(isValidTransition(TicketStatus.ABIERTO, TicketStatus.EN_REVISION)).toBe(true);
      expect(isValidTransition(TicketStatus.ABIERTO, TicketStatus.EN_PROGRESO)).toBe(true);
      expect(isValidTransition(TicketStatus.ABIERTO, TicketStatus.CERRADO)).toBe(true);
      expect(isValidTransition(TicketStatus.ABIERTO, TicketStatus.RECHAZADO)).toBe(true);
    });

    it('debe rechazar transiciones no permitidas desde Abierto', () => {
      expect(isValidTransition(TicketStatus.ABIERTO, TicketStatus.RESUELTO)).toBe(false);
      expect(isValidTransition(TicketStatus.ABIERTO, TicketStatus.ABIERTO)).toBe(false);
    });

    it('debe validar transiciones permitidas desde En revision', () => {
      expect(isValidTransition(TicketStatus.EN_REVISION, TicketStatus.EN_PROGRESO)).toBe(true);
      expect(isValidTransition(TicketStatus.EN_REVISION, TicketStatus.RESUELTO)).toBe(true);
      expect(isValidTransition(TicketStatus.EN_REVISION, TicketStatus.CERRADO)).toBe(true);
      expect(isValidTransition(TicketStatus.EN_REVISION, TicketStatus.RECHAZADO)).toBe(true);
    });

    it('debe rechazar transiciones no permitidas desde En revision', () => {
      expect(isValidTransition(TicketStatus.EN_REVISION, TicketStatus.ABIERTO)).toBe(false);
    });

    it('debe validar transiciones permitidas desde En progreso', () => {
      expect(isValidTransition(TicketStatus.EN_PROGRESO, TicketStatus.EN_REVISION)).toBe(true);
      expect(isValidTransition(TicketStatus.EN_PROGRESO, TicketStatus.RESUELTO)).toBe(true);
      expect(isValidTransition(TicketStatus.EN_PROGRESO, TicketStatus.CERRADO)).toBe(true);
    });

    it('debe rechazar transiciones no permitidas desde En progreso (incluyendo Rechazado)', () => {
      expect(isValidTransition(TicketStatus.EN_PROGRESO, TicketStatus.ABIERTO)).toBe(false);
      expect(isValidTransition(TicketStatus.EN_PROGRESO, TicketStatus.RECHAZADO)).toBe(false);
    });

    it('debe validar transiciones permitidas desde Resuelto', () => {
      expect(isValidTransition(TicketStatus.RESUELTO, TicketStatus.EN_PROGRESO)).toBe(true);
      expect(isValidTransition(TicketStatus.RESUELTO, TicketStatus.CERRADO)).toBe(true);
    });

    it('debe rechazar transiciones no permitidas desde Resuelto (incluyendo Rechazado)', () => {
      expect(isValidTransition(TicketStatus.RESUELTO, TicketStatus.ABIERTO)).toBe(false);
      expect(isValidTransition(TicketStatus.RESUELTO, TicketStatus.EN_REVISION)).toBe(false);
      expect(isValidTransition(TicketStatus.RESUELTO, TicketStatus.RECHAZADO)).toBe(false);
    });

    it('debe rechazar cualquier transición desde el estado terminal Cerrado', () => {
      expect(isValidTransition(TicketStatus.CERRADO, TicketStatus.ABIERTO)).toBe(false);
      expect(isValidTransition(TicketStatus.CERRADO, TicketStatus.EN_REVISION)).toBe(false);
      expect(isValidTransition(TicketStatus.CERRADO, TicketStatus.EN_PROGRESO)).toBe(false);
      expect(isValidTransition(TicketStatus.CERRADO, TicketStatus.RESUELTO)).toBe(false);
      expect(isValidTransition(TicketStatus.CERRADO, TicketStatus.CERRADO)).toBe(false);
      expect(isValidTransition(TicketStatus.CERRADO, TicketStatus.RECHAZADO)).toBe(false);
    });

    it('debe rechazar cualquier transición desde el estado terminal Rechazado', () => {
      expect(isValidTransition(TicketStatus.RECHAZADO, TicketStatus.ABIERTO)).toBe(false);
      expect(isValidTransition(TicketStatus.RECHAZADO, TicketStatus.EN_REVISION)).toBe(false);
      expect(isValidTransition(TicketStatus.RECHAZADO, TicketStatus.EN_PROGRESO)).toBe(false);
      expect(isValidTransition(TicketStatus.RECHAZADO, TicketStatus.RESUELTO)).toBe(false);
      expect(isValidTransition(TicketStatus.RECHAZADO, TicketStatus.CERRADO)).toBe(false);
      expect(isValidTransition(TicketStatus.RECHAZADO, TicketStatus.RECHAZADO)).toBe(false);
    });

    it('debe retornar false si el estado actual es desconocido', () => {
      expect(isValidTransition('Desconocido', TicketStatus.ABIERTO)).toBe(false);
      expect(isValidTransition(null, TicketStatus.ABIERTO)).toBe(false);
    });
  });
});
