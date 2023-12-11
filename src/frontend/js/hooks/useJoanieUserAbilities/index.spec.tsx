import { act, renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { JoanieUserProfileFactory } from 'utils/test/factories/joanie';
import { JoanieUserApiAbilityActions } from 'types/User';
import { JoanieUserProfileActions } from 'utils/AbilitiesHelper/types';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Deferred } from 'utils/test/deferred';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { useJoanieUserAbilities } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('useJoanieUserAbilities', () => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <JoanieSessionProvider>{children}</JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  beforeEach(() => {
    fetchMock
      .get('https://joanie.endpoint/api/v1.0/orders/', [])
      .get('https://joanie.endpoint/api/v1.0/addresses/', [])
      .get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it("should return an entity with joanie's profile rights", async () => {
    const responseDeferred = new Deferred();
    fetchMock.get('https://joanie.endpoint/api/v1.0/users/me/', responseDeferred.promise);

    const { result } = renderHook(() => useJoanieUserAbilities(), {
      wrapper: Wrapper,
    });
    expect(result.current).toBeUndefined();

    await act(async () => {
      responseDeferred.resolve(
        JoanieUserProfileFactory({
          abilities: {
            [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: false,
            [JoanieUserApiAbilityActions.HAS_COURSE_ACCESS]: true,
          },
        }).one(),
      );
    });

    await waitFor(() => expect(result.current).not.toBeUndefined());

    expect(result.current?.can(JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD)).toBe(true);
    expect(result.current?.cannot(JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD)).toBe(false);
  });
});
