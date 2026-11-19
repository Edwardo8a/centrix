const logger = require('../src/utils/logger');

describe('logger', () => {
  let consoleInfoSpy, consoleErrorSpy, consoleWarnSpy;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe registrar info', () => {
    // Act
    logger.info('test info');
    
    // Assert
    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] test info', {});
  });

  it('debe registrar error', () => {
    // Act
    logger.error('test err');
    
    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] test err', {});
  });

  it('debe registrar warn', () => {
    // Act
    logger.warn('test warn');
    
    // Assert
    expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] test warn', {});
  });
});
