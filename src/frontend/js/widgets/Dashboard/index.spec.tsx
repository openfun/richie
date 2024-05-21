import { getByText, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { AddressFactory } from 'utils/test/factories/joanie';
import { location } from 'utils/indirection/window';
import { User } from 'types/User';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import { Address } from 'types/Joanie';
import { expectUrlMatchLocationDisplayed } from 'utils/test/expectUrlMatchLocationDisplayed';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
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
  setupJoanieSession();

  beforeEach(() => {
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&is_active=true&page=1&page_size=50',
      { count: 0, results: [] },
    );
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=1&page_size=50',
      {
        count: 0,
        results: [],
      },
    );
  });

  it('should redirect to the site root if user is not authenticated', async () => {
    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: {
        client: createTestQueryClient({ user: null }),
      },
    });

    expect(location.replace).toHaveBeenNthCalledWith(1, '/');
  });

  it('should redirect from dashboard index route to courses route', async () => {
    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    await expectNoSpinner('Loading orders and enrollments...');

    expect(location.replace).not.toBeCalled();
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.COURSES);
  });

  it('should render breadcrumbs', async () => {
    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
    });
    await expectNoSpinner('Loading orders and enrollments...');
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My courses']);
  });

  it('changes route when using the sidebar', async () => {
    const richieUser = UserFactory().one();
    fetchMock.get(`https://demo.endpoint/api/user/v1/accounts/${richieUser.username}`, {});
    fetchMock.get(`https://demo.endpoint/api/user/v1/preferences/${richieUser.username}`, {});
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [], { overwriteRoutes: true });
    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: {
        client: createTestQueryClient({ user: richieUser }),
      },
    });
    await expectNoSpinner('Loading orders and enrollments...');
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.COURSES);

    // Go to "My Preferences" route.
    const link = screen.getByRole('link', { name: 'My preferences' });
    fetchMock.get('https://demo.endpoint/api/v1.0/user/me', richieUser);
    const user = userEvent.setup();
    await user.click(link);

    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.PREFERENCES);
  });

  it('redirect when clicking on the breadcrumbs back button', async () => {
    const richieUser = UserFactory().one();
    fetchMock.get(`https://demo.endpoint/api/user/v1/accounts/${richieUser.username}`, {});
    fetchMock.get(`https://demo.endpoint/api/user/v1/preferences/${richieUser.username}`, {});
    const address: Address = AddressFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address], {
      overwriteRoutes: true,
    });
    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: {
        client: createTestQueryClient({ user: richieUser }),
      },
    });
    await expectNoSpinner('Loading orders and enrollments...');
    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.COURSES);
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My courses']);

    // Go to "My Preferences" route.
    const link = screen.getByRole('link', { name: 'My preferences' });
    fetchMock.get('https://demo.endpoint/api/v1.0/user/me', richieUser);
    const user = userEvent.setup();
    await user.click(link);

    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.PREFERENCES);
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My preferences']);

    // Go to the address edit route.
    const button = await screen.findByRole('button', { name: 'Edit' });
    await user.click(button);

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
    await user.click(backButton);

    expectUrlMatchLocationDisplayed(LearnerDashboardPaths.PREFERENCES);
    expectBreadcrumbsToEqualParts(['chevron_leftBack', 'My preferences']);

    // Click again on back button to get redirect to website's root.
    expect(location.replace).not.toHaveBeenCalled();
    await user.click(backButton);
    expect(location.replace).toHaveBeenCalledWith('https://localhost');
  });

  it('should render username in sidebar if full_name is not defined', async () => {
    const richieUser: User = UserFactory({ full_name: undefined }).one();
    fetchMock.get(`https://demo.endpoint/api/user/v1/accounts/${richieUser.username}`, {});
    fetchMock.get(`https://demo.endpoint/api/user/v1/preferences/${richieUser.username}`, {});
    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: {
        client: createTestQueryClient({ user: richieUser }),
      },
    });
    await expectNoSpinner('Loading orders and enrollments...');

    const sidebar = screen.getByTestId('dashboard__sidebar');
    getByText(sidebar, richieUser.username, { exact: false });
  });

  it('should render full_name in sidebar', async () => {
    const richieUser = UserFactory().one();
    fetchMock.get(`https://demo.endpoint/api/user/v1/accounts/${richieUser.username}`, {});
    fetchMock.get(`https://demo.endpoint/api/user/v1/preferences/${richieUser.username}`, {});

    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
      queryOptions: {
        client: createTestQueryClient({ user: richieUser }),
      },
    });
    await expectNoSpinner('Loading orders and enrollments...');

    const sidebar = screen.getByTestId('dashboard__sidebar');
    getByText(sidebar, richieUser.full_name!, { exact: false });
  });

  it("should redirect to 404 page when route doesn't exist", async () => {
    render(<DashboardTest initialRoute="/dummy/route" />, {
      wrapper: BaseJoanieAppWrapper,
    });

    expectUrlMatchLocationDisplayed('/dummy/route');
    expect(screen.getByRole('heading', { name: /Page not found/ }));
  });
});
