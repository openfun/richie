import { renderHook } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { JoanieUserProfileFactory } from 'utils/test/factories/joanie';
import { JoanieUserApiAbilityActions, JoanieUserProfile } from 'types/User';
import { JoanieUserProfileActions } from 'utils/AbilitiesHelper/types';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
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
  const Wrapper = ({
    children,
    joanieUserProfile,
  }: PropsWithChildren & { joanieUserProfile: JoanieUserProfile }) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true, joanieUserProfile })}>
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
    const { result } = renderHook(() => useJoanieUserAbilities(), {
      wrapper: ({ children }: PropsWithChildren) => (
        <Wrapper
          joanieUserProfile={JoanieUserProfileFactory({
            abilities: {
              [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: false,
              [JoanieUserApiAbilityActions.HAS_COURSE_ACCESS]: true,
            },
          }).one()}
        >
          {children}
        </Wrapper>
      ),
    });

    expect(result.current?.can(JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD)).toBe(true);
    expect(result.current?.cannot(JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD)).toBe(false);
  });
});
