import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import ProtectedRoute from './ProtectedRoute';
import { location } from '../../utils/indirection/window';
import {
  FonzieUserFactory,
  PersistedClientFactory,
  QueryStateFactory,
} from '../../utils/test/factories';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from '../../settings';

jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
}));

describe('<ProtectedRoute />', () => {
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

  it('does not redirect to the default page if the user is authenticated and the route is protected', async () => {
    const user = initializeUser(true);
    await act(async () => {
      render(
        <ProtectedRoute isAllowed={!!user} redirectPath="/">
          <h2>Protected element</h2>
        </ProtectedRoute>,
      );
    });
    screen.getByRole('heading', { level: 2, name: 'Protected element' });
  });

  it('does redirect to the default page if the user is not authenticated and the route is protected', async () => {
    const user = initializeUser(false);
    await act(async () => {
      render(
        <ProtectedRoute isAllowed={!!user} redirectPath="/">
          <h2>Test</h2>
        </ProtectedRoute>,
      );
    });
    expect(location.assign).toHaveBeenNthCalledWith(1, '/');
  });
});
