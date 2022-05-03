import type { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import JoanieApiProvider, { useJoanieApi } from 'data/JoanieApiProvider/index';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).generate(),
}));

describe('useJoanieApi', () => {
  it('returns the joanie api interface', () => {
    const { result } = renderHook(useJoanieApi, {
      wrapper: ({ children }: PropsWithChildren<{}>) => (
        <JoanieApiProvider>{children}</JoanieApiProvider>
      ),
    });

    expect(result.current).toBeInstanceOf(Object);
    expect(result.current.user).toBeInstanceOf(Object);
    expect(result.current.courses).toBeInstanceOf(Object);
  });

  it('throws an error if it is not used within a JoanieApiProvider', () => {
    const { result } = renderHook(useJoanieApi);
    expect(result.error).toEqual(
      new Error('useJoanieApi must be used within a JoanieApiProvider.'),
    );
  });
});
