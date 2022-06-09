import { queryAllByRole, render, screen } from '@testing-library/react';
import * as mockFactories from 'utils/test/factories';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import { FonzieUserFactory, PersistedClientFactory, QueryStateFactory } from 'utils/test/factories';
import { act } from 'react-dom/test-utils';
import DashBoardRouter from './Router';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from '../../settings';
import { SessionProvider } from '../../data/SessionProvider';
import createQueryClient from '../../utils/react-query/createQueryClient';
import { location } from '../../utils/indirection/window';
import { DashBoardRoute } from './routes';
import ProtectedRoute from './ProtectedRoute';

jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

describe('<DashBoardRouter />', () => {
  const DEFAULT_ROUTES = [
    {
      path: '/courses',
      title: 'courses',
      element: <h2>Courses</h2>,
    },
    {
      path: '/preferences',
      title: 'preferences',
      element: <h2>Preferences</h2>,
    },
    {
      path: '/protected_path',
      title: 'protected',
      element: (
        <ProtectedRoute isAllowed={false} redirectPath="/">
          <h2>Never ever</h2>
        </ProtectedRoute>
      ),
    },
  ];
  const Wrapper = ({
    initial_entries,
    routes = DEFAULT_ROUTES,
  }: {
    initial_entries: Array<string>;
    routes?: Array<DashBoardRoute>;
  }) => {
    return (
      <QueryClientProvider client={createQueryClient({ persistor: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <MemoryRouter initialEntries={initial_entries}>
              <DashBoardRouter routes={routes} />
            </MemoryRouter>
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  const initializeUser = (loggedin = true) => {
    const user = loggedin ? FonzieUserFactory.generate() : null;

    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        PersistedClientFactory({ queries: [QueryStateFactory('user', { data: user })] }),
      ),
    );

    if (loggedin) {
      sessionStorage.setItem(RICHIE_USER_TOKEN, user.access_token);
    }

    return user;
  };

  beforeEach(() => {
    sessionStorage.clear();
  });

  it('shows a navigation displaying all provided paths', async () => {
    await act(async () => {
      render(<Wrapper initial_entries={['/']} />);
    });
    DEFAULT_ROUTES.forEach(({ path, title }) => {
      if (title) {
        const $link = screen.getAllByRole('link', { name: title })[0];
        expect($link.getAttribute('href')).toBe(path);
      }
    });
  });

  it('does not show a link if the method "show" of the route return false', async () => {
    initializeUser(true);
    await act(async () => {
      render(
        <Wrapper
          initial_entries={['/title']}
          routes={[
            {
              title: 'title',
              path: '/title',
              element: <h2>Title</h2>,
            },
            {
              title: 'preferences',
              path: '/preferences',
              element: <h2>Preferences</h2>,
              show: () => false,
            },
          ]}
        />,
      );
    });
    expect(screen.queryAllByRole('link', { name: 'preferences' })).toHaveLength(0);
    screen.getByRole('link', { name: 'title' });
  });

  it('redirects to the default page if the user is not authenticated and the page is protected', async () => {
    await act(async () => {
      render(<Wrapper initial_entries={['/protected_path']} />);
    });
    expect(location.assign).toHaveBeenNthCalledWith(1, '/');
  });

  it('does redirect to the 404 page if the path does not exist', async () => {
    await act(async () => {
      render(<Wrapper initial_entries={['/a_path_that_does_not_exist']} />);
    });
    screen.getByRole('heading', { level: 2, name: '404 Not Found' });
  });
});
