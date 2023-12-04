import { renderHook } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { useJoanieUserAbilities } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
  }).one(),
}));

describe('useJoanieUserAbilities', () => {
  it("should return undefined when joanie's not enabled", () => {
    const { result } = renderHook(() => useJoanieUserAbilities());
    expect(result.current).toBeUndefined();
  });
});
