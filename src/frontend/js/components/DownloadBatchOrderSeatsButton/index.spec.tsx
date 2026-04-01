import { buildFilename, sanitizeForFilename } from '.';

describe('sanitizeForFilename', () => {
  it('replaces spaces with underscores', () => {
    expect(sanitizeForFilename('Formation React')).toBe('Formation_React');
  });

  it('removes diacritics', () => {
    expect(sanitizeForFilename('Développement web')).toBe('Developpement_web');
  });

  it('removes special characters', () => {
    expect(sanitizeForFilename('C++ / Python')).toBe('C_Python');
  });

  it('preserves hyphens', () => {
    expect(sanitizeForFilename('Formation React - Advanced')).toBe('Formation_React_-_Advanced');
  });

  it('trims leading and trailing spaces', () => {
    expect(sanitizeForFilename('  Formation  ')).toBe('Formation');
  });
});

describe('buildFilename', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T09:30:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds the expected filename', () => {
    expect(buildFilename('seats', 'Formation React')).toBe(
      'seats_Formation_React_2026-04-15_09-30.csv',
    );
  });

  it('sanitizes the product title in the filename', () => {
    expect(buildFilename('seats', 'Développement web avancé')).toBe(
      'seats_Developpement_web_avance_2026-04-15_09-30.csv',
    );
  });
});
