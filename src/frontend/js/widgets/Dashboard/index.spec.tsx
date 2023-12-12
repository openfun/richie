import { fireEvent, getByText, render, screen, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { AddressFactory } from 'utils/test/factories/joanie';
import { location } from 'utils/indirection/window';
import { User } from 'types/User';
import { Nullable } from 'types/utils';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import { Address } from 'types/Joanie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { expectUrlMatchLocationDisplayed } from 'utils/test/expectUrlMatchLocationDisplayed';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { LearnerDashboardPaths } from './utils/learnerRouteMessages';
import { DashboardTest } from './components/DashboardTest';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    href: '',
    replace: jest.fn(),
  },
}));

jest.mock('hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (props: any) => {
    (globalThis as any).__intersection_observer_props__ = props;
  },
}));

describe('<Dashboard />', () => {
  const DashboardWithUser = ({ user }: { user: Nullable<User> }) => {
    return (
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <JoanieSessionProvider>
            <DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />
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
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/enrollments/?page=1&page_size=50&was_created_by_order=false',
      { count: 0, results: [] },
    );
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/?page=1&page_size=50&product__type=credential',
      {
        count: 0,
        results: [],
      },
    );
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should redirect to the site root if user is not authenticated', async () => {
    await act(async () => {
      render(<DashboardWithUser user={null} />);
    });

    expect(location.replace).toHaveBeenNthCalledWith(1, '/');
  });

  it('should redirect from dashboard index route to courses route', () => {
    const user = UserFactory().one();

    render(<DashboardWithUser user={user} />);

    expect(location.replace).not.toBeCalled();
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.COURSES);
  });

  it('should render breadcrumbs', () => {
    const user = UserFactory().one();

    render(<DashboardWithUser user={user} />);
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My courses']);
  });

  it('changes route when using the sidebar', async () => {
    const user = UserFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [], { overwriteRoutes: true });
    render(<DashboardWithUser user={user} />);
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.COURSES);

    // Go to "My Preferences" route.
    const link = screen.getByRole('link', { name: 'My preferences' });
    await act(async () => {
      fireEvent.click(link);
    });
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.PREFERENCES);
  });

  it('redirect when clicking on the breadcrumbs back button', async () => {
    const user = UserFactory().one();
    const address: Address = AddressFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address], {
      overwriteRoutes: true,
    });
    render(<DashboardWithUser user={user} />);
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.COURSES);
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My courses']);

    // Go to "My Preferences" route.
    const link = screen.getByRole('link', { name: 'My preferences' });
    await act(async () => {
      fireEvent.click(link);
    });
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.PREFERENCES);
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My preferences']);

    // Go to the address edit route.
    const button = await screen.findByRole('button', { name: 'Edit' });
    await act(async () => {
      fireEvent.click(button);
    });
    expectUrlMatchLocationDisplayed(
      LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION.replace(':addressId', address.id),
    );
    expectBreadcrumbsToEqualParts([
      'chevron_leftBack',
      'My preferences',
      'Edit address "' + address.title + '"',
    ]);

    // Click on back button goes back to "My Preferences".
    const backButton = await screen.findByRole('link', { name: /Back/ });
    await act(async () => {
      fireEvent.click(backButton);
    });
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.PREFERENCES);
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My preferences']);

    // Click again on back button to get redirect to website's root.
    expect(location.replace).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(backButton);
    });
    expect(location.replace).toHaveBeenCalledWith('https://localhost');
  });

  it('should render username in sidebar if full_name is not defined', () => {
    const user: User = UserFactory({ full_name: undefined }).one();
    render(<DashboardWithUser user={user} />);
    const sidebar = screen.getByTestId('dashboard__sidebar');
    getByText(sidebar, user.username, { exact: false });
  });

  it('should render full_name in sidebar', () => {
    const user: User = UserFactory().one();
    render(<DashboardWithUser user={user} />);
    const sidebar = screen.getByTestId('dashboard__sidebar');
    getByText(sidebar, user.full_name!, { exact: false });
  });
});
