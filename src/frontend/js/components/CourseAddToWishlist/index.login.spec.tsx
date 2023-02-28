/**
 * Test suite for CourseAddToWishlist component
 * for logged visitors
 */
import { render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import * as mockFactories from 'utils/test/factories';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieApiProvider from 'data/JoanieApiProvider';
import { SessionProvider } from 'data/SessionProvider';
import CourseAddToWishlist from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: {
        backend: 'fonzie',
        endpoint: 'https://authentication.test',
      },
      joanie_backend: {
        endpoint: 'https://joanie.test',
      },
    })
    .generate(),
}));

const renderCourseAddToWishlist = (courseCode: string) =>
  render(
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <JoanieApiProvider>
          <SessionProvider>
            <CourseAddToWishlist courseCode={courseCode} />
          </SessionProvider>
        </JoanieApiProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );

describe('CourseAddToWishlist', () => {
  const wishlistCourse = mockFactories.UserWishlistCourseFactory.generate();

  beforeEach(() => {
    // JoanieSessionProvider inital requests
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders a notify me button', async () => {
    fetchMock.get(
      `https://joanie.test/api/v1.0/wishlist/?course_code=${wishlistCourse.course}`,
      [],
    );
    renderCourseAddToWishlist(wishlistCourse.course);

    // wait for JoanieSession initialization
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    // wait for CourseAddToWishlist initialization
    await waitFor(() => expect(screen.queryByTestId('spinner')).not.toBeInTheDocument());

    const $notifyButton = screen.getByRole('button', { name: 'Notify me' });
    expect($notifyButton).toBeInTheDocument();

    let nbApiCalls = 3; // JoanieSessionProvider initial requests
    nbApiCalls += 1; // useUserWishlistCourses inital fetch
    expect(fetchMock.calls().length).toBe(nbApiCalls);

    // We dont care about POST request return values,
    // react-query will refetch data using the GET url.
    fetchMock.post(`https://joanie.test/api/v1.0/wishlist/`, []);
    fetchMock.get(
      `https://joanie.test/api/v1.0/wishlist/?course_code=${wishlistCourse.course}`,
      [wishlistCourse],
      { overwriteRoutes: true },
    );
    await userEvent.click($notifyButton);

    expect(
      await screen.findByRole('button', { name: 'Do not notify me anymore' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Notify me' })).not.toBeInTheDocument();

    nbApiCalls += 1; // useUserWishlistCourses POST
    nbApiCalls += 1; // useUserWishlistCourses refetching
    expect(fetchMock.calls().length).toBe(nbApiCalls);
  });

  it('renders a "do not notify me" button', async () => {
    fetchMock.get(
      `https://joanie.test/api/v1.0/wishlist/?course_code=${wishlistCourse.course}`,
      [wishlistCourse],
      { overwriteRoutes: true },
    );
    renderCourseAddToWishlist(wishlistCourse.course);

    // wait for JoanieSession initialization
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    // wait for CourseAddToWishlist initialization
    await waitFor(() => expect(screen.queryByTestId('spinner')).not.toBeInTheDocument());

    const $stopNotifyButton = await screen.findByRole('button', {
      name: 'Do not notify me anymore',
    });
    expect($stopNotifyButton).toBeInTheDocument();

    let nbApiCalls = 3; // JoanieSessionProvider initial requests
    nbApiCalls += 1; // useUserWishlistCourses inital fetch
    expect(fetchMock.calls().length).toBe(nbApiCalls);

    // We dont care about POST request return values,
    // react-query will refetch data using the GET url.
    fetchMock.delete(`https://joanie.test/api/v1.0/wishlist/${wishlistCourse.id}/`, []);
    fetchMock.get(
      `https://joanie.test/api/v1.0/wishlist/?course_code=${wishlistCourse.course}`,
      [],
      { overwriteRoutes: true },
    );
    await userEvent.click($stopNotifyButton);

    expect(await screen.findByRole('button', { name: 'Notify me' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Do not notify me anymore' }),
    ).not.toBeInTheDocument();

    nbApiCalls += 1; // useUserWishlistCourses DELETE
    nbApiCalls += 1; // useUserWishlistCourses refetching
    expect(fetchMock.calls().length).toBe(nbApiCalls);
  });
});
