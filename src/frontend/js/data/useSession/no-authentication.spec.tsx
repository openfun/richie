import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { Maybe, Nullable } from 'types/utils';
import { User } from 'types/User';
import { SessionProvider, useSession } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: undefined,
  }).generate(),
}));

describe('useSession', () => {
  const queryClient = createQueryClient({ persistor: true });

  beforeEach(() => {
    jest.useFakeTimers('modern');
    queryClient.clear();
    fetchMock.restore();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('provides a null user if there is no authentication backend', async () => {
    let userInComponent: Maybe<Nullable<User>>;

    const Component = () => {
      const { user } = useSession();
      userInComponent = user;
      return <span>component rendered</span>;
    };

    render(
      <SessionProvider>
        <Component />
      </SessionProvider>,
    );

    expect(userInComponent).toBeNull();
    screen.getByText('component rendered');
  });
});
