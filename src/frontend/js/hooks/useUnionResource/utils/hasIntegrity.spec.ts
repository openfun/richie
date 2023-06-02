import { IntegrityData, hasIntegrity } from './hasIntegrity';

describe('useUnionResource > utils > hasIngegrity', () => {
  it('should return true `integrityCount` first elements of stacks are in the same order', () => {
    const stack: IntegrityData[] = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
    const newStack: IntegrityData[] = [{ id: '1' }, { id: '2' }, { id: '4' }, { id: '3' }];
    expect(hasIntegrity<IntegrityData>(stack, newStack, 2)).toBe(true);
  });

  it("should return false `integrityCount` first elements of stacks aren't in the same order", () => {
    const stack: IntegrityData[] = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];
    const newStack: IntegrityData[] = [{ id: '2' }, { id: '1' }, { id: '3' }, { id: '4' }];
    expect(hasIntegrity<IntegrityData>(stack, newStack, 2)).toBe(false);
  });

  it('should return false if both stack are smaller than requested integrity count', () => {
    const stack: IntegrityData[] = [{ id: '1' }];
    const newStack: IntegrityData[] = [{ id: '1' }];
    expect(hasIntegrity<IntegrityData>(stack, newStack, 2)).toBe(false);
  });

  it('should return false if `stack` is smaller than requested integrity count', () => {
    const stack: IntegrityData[] = [{ id: '1' }];
    const newStack: IntegrityData[] = [{ id: '1' }, { id: '2' }];
    expect(hasIntegrity<IntegrityData>(stack, newStack, 2)).toBe(false);
  });

  it('should return false if `newStack` is smaller than requested integrity count', () => {
    const stack: IntegrityData[] = [{ id: '1' }, { id: '2' }];
    const newStack: IntegrityData[] = [{ id: '1' }];
    expect(hasIntegrity<IntegrityData>(stack, newStack, 2)).toBe(false);
  });
});
