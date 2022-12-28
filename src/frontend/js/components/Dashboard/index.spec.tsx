import { fireEvent, getByText, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { act } from 'react-dom/test-utils';
import * as mockFactories from 'utils/test/factories';
import { UserFactory } from 'utils/test/factories';
import { location } from 'utils/indirection/window';
import { User } from 'types/User';
import { Nullable } from 'types/utils';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import { Address } from 'types/Joanie';
import JoanieSessionProvider from 'data/SessionProvider/JoanieSessionProvider';
import { DashboardPaths } from 'utils/routers/dashboard';
import { expectUrlMatchLocationDisplayed } from 'utils/test/expectUrlMatchLocationDisplayed';
import { DashboardTest } from 'components/Dashboard/DashboardTest';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    href: '',
    replace: jest.fn(),
  },
}));

describe('<Dashboard />', () => {
  const DashboardWithUser = ({ user }: { user: Nullable<User> }) => {
    return (
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <JoanieSessionProvider>
            <DashboardTest initialRoute={DashboardPaths.COURSES} />
          </JoanieSessionProvider>
        </QueryClientProvider>
      </IntlProvider>
    );
  };

  beforeEach(() => {
    jest.resetAllMocks();
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should redirect to the site root if user is not authenticated', () => {
    render(<DashboardWithUser user={null} />);

    expect(location.replace).toHaveBeenNthCalledWith(1, '/');
  });

  it('should redirect from dashboard index route to courses route', () => {
    const user = UserFactory.generate();

    render(<DashboardWithUser user={user} />);

    expect(location.replace).not.toBeCalled();
    expectUrlMatchLocationDisplayed(DashboardPaths.COURSES);
  });

  it('should render breadcrumbs', () => {
    const user = UserFactory.generate();

    render(<DashboardWithUser user={user} />);
    expectBreadcrumbsToEqualParts(['Back', 'My courses']);
  });

  it('changes route when using the sidebar', async () => {
    const user = UserFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [], { overwriteRoutes: true });
    render(<DashboardWithUser user={user} />);
    expectUrlMatchLocationDisplayed(DashboardPaths.COURSES);

    // Go to "My Preferences" route.
    const link = screen.getByRole('link', { name: 'My preferences' });
    await act(async () => {
      fireEvent.click(link);
    });
    expectUrlMatchLocationDisplayed(DashboardPaths.PREFERENCES);
  });

  it('redirect when clicking on the breadcrumbs back button', async () => {
    const user = UserFactory.generate();
    const address: Address = mockFactories.AddressFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address], {
      overwriteRoutes: true,
    });
    render(<DashboardWithUser user={user} />);
    expectUrlMatchLocationDisplayed(DashboardPaths.COURSES);
    await expectBreadcrumbsToEqualParts(['Back', 'My courses']);

    // Go to "My Preferences" route.
    const link = screen.getByRole('link', { name: 'My preferences' });
    await act(async () => {
      fireEvent.click(link);
    });
    expectUrlMatchLocationDisplayed(DashboardPaths.PREFERENCES);
    await expectBreadcrumbsToEqualParts(['Back', 'My preferences']);

    // Go to the address edit route.
    const button = await screen.findByRole('button', { name: 'Edit' });
    await act(async () => {
      fireEvent.click(button);
    });
    expectUrlMatchLocationDisplayed(
      DashboardPaths.PREFERENCES_ADDRESS_EDITION.replace(':addressId', address.id),
    );
    await expectBreadcrumbsToEqualParts([
      'Back',
      'My preferences',
      'Edit address "' + address.title + '"',
    ]);

    // Click on back button goes back to "My Preferences".
    const backButton = await screen.findByRole('link', { name: 'Back' });
    await act(async () => {
      fireEvent.click(backButton);
    });
    expectUrlMatchLocationDisplayed(DashboardPaths.PREFERENCES);
    await expectBreadcrumbsToEqualParts(['Back', 'My preferences']);

    // Click again on back button to get redirect to website's root.
    expect(location.replace).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(backButton);
    });
    expect(location.replace).toHaveBeenCalledWith('https://localhost');
  });

  it('should render username in sidebar', () => {
    const user: User = UserFactory.generate();
    render(<DashboardWithUser user={user} />);
    const sidebar = screen.getByTestId('dashboard__sidebar');
    getByText(sidebar, user.username, { exact: false });
  });
});
