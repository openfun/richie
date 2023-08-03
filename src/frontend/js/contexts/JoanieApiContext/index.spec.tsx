import type { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { noop } from 'utils';
import JoanieApiProvider, { useJoanieApi } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).one(),
}));

describe('useJoanieApi', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(noop);
  });

  it('returns the joanie api interface', () => {
    const { result } = renderHook(useJoanieApi, {
      wrapper: ({ children }: PropsWithChildren<{}>) => (
        <JoanieApiProvider>{children}</JoanieApiProvider>
      ),
    });

    expect(result.current).toBeInstanceOf(Object);
    expect(result.current.user).toBeInstanceOf(Object);
    expect(result.current.courses.products).toBeInstanceOf(Object);
  });

  it('throws an error if it is not used within a JoanieApiProvider', () => {
    expect(() => {
      renderHook(useJoanieApi);
    }).toThrow('useJoanieApi must be used within a JoanieApiProvider.');
  });
});
