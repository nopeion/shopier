import { safeJsonParse, safeJsonReviver } from '../../src/utils/safe-json';

describe('safeJsonReviver', () => {
  it('should drop dangerous keys like __proto__, constructor, and prototype', () => {
    expect(safeJsonReviver('__proto__', { polluted: true })).toBeUndefined();
    expect(safeJsonReviver('constructor', { polluted: true })).toBeUndefined();
    expect(safeJsonReviver('prototype', { polluted: true })).toBeUndefined();
  });

  it('should preserve valid keys', () => {
    expect(safeJsonReviver('validKey', 'validValue')).toBe('validValue');
    expect(safeJsonReviver('id', 123)).toBe(123);
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON objects correctly', () => {
    const jsonStr = '{"name": "Shopier", "active": true, "count": 5}';
    const result = safeJsonParse<{ name: string; active: boolean; count: number }>(jsonStr);
    expect(result).toEqual({ name: 'Shopier', active: true, count: 5 });
  });

  it('should strip __proto__ pollution attempts', () => {
    const jsonStr = '{"title": "Test", "__proto__": {"polluted": true}}';
    const result = safeJsonParse<Record<string, unknown>>(jsonStr);
    expect(result).toEqual({ title: 'Test' });
    expect(({} as any).polluted).toBeUndefined();
  });

  it('should strip constructor and prototype pollution attempts', () => {
    const jsonStr = '{"constructor": {"prototype": {"polluted": true}}, "valid": "data"}';
    const result = safeJsonParse<Record<string, unknown>>(jsonStr);
    expect(result).toEqual({ valid: 'data' });
  });
});
