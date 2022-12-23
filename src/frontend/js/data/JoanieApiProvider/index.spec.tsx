import type { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import JoanieApiProvider, { useJoanieApi } from 'data/JoanieApiProvider/index';
import { noop } from 'utils';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).generate(),
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
    expect(result.current.products).toBeInstanceOf(Object);
  });

  it('throws an error if it is not used within a JoanieApiProvider', () => {
    expect(() => {
      renderHook(useJoanieApi);
    }).toThrow('useJoanieApi must be used within a JoanieApiProvider.');
  });
});
