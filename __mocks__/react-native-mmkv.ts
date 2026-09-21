const mockStorage = new Map<string, string>();

export const createMMKV = jest.fn().mockImplementation(() => ({
  set: jest.fn((key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  getString: jest.fn((key: string) => mockStorage.get(key) ?? null),
  getNumber: jest.fn((key: string) => {
    const val = mockStorage.get(key);
    return val ? Number(val) : undefined;
  }),
  getBoolean: jest.fn((key: string) => {
    const val = mockStorage.get(key);
    return val === 'true';
  }),
  contains: jest.fn((key: string) => mockStorage.has(key)),
  remove: jest.fn((key: string) => {
    mockStorage.delete(key);
  }),
  clearAll: jest.fn(() => {
    mockStorage.clear();
  }),
}));
