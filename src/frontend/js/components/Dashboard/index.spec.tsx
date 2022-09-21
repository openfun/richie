import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { hydrate, QueryClientProvider } from 'react-query';
import {
  ContextFactory as mockContextFactory,
  PersistedClientFactory,
  QueryStateFactory,
  UserFactory,
} from 'utils/test/factories';
import BaseSessionProvider from 'data/SessionProvider/BaseSessionProvider';
import createQueryClient from 'utils/react-query/createQueryClient';
import { location } from 'utils/indirection/window';
import { User } from 'types/User';
import { Nullable } from 'types/utils';
import Dashboard from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory().generate(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

jest.mock('utils/routers/dashboard/useDashboardRouter/getDashboardBasename', () => ({
  getDashboardBasename: () => '',
}));

describe('<Dashboard />', () => {
  const DashboardWithUser = ({ user }: { user: Nullable<User> }) => {
    const { clientState } = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: user })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    return (
      <IntlProvider locale="en">
        <QueryClientProvider client={client}>
          <BaseSessionProvider>
            <Dashboard />
          </BaseSessionProvider>
        </QueryClientProvider>
      </IntlProvider>
    );
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should redirect to the site root if user is not authenticated', () => {
    render(<DashboardWithUser user={null} />);

    expect(location.replace).toHaveBeenNthCalledWith(1, '/');
  });

  it('should redirect from dashboard index route to courses route', () => {
    const user = UserFactory.generate();

    render(<DashboardWithUser user={user} />);

    expect(location.replace).not.toBeCalled();
    screen.getByTestId('RouteInfo-/courses');
  });
});
