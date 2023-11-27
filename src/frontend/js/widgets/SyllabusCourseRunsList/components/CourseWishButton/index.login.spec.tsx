/**
 * Test suite for CourseAddToWishlist component
 * for logged visitors
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { SessionProvider } from 'contexts/SessionContext';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { CourseLight } from 'types/Joanie';
import { CourseLightFactory } from 'utils/test/factories/joanie';
import CourseWishButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      backend: 'fonzie',
      endpoint: 'https://authentication.test',
    },
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).one(),
}));

const renderButton = (course: CourseLight) =>
  render(
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <JoanieApiProvider>
          <SessionProvider>
            <CourseWishButton course={course} />
          </SessionProvider>
        </JoanieApiProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );

describe('CourseWishButton', () => {
  const course = CourseLightFactory().one();

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
    fetchMock.get(`https://joanie.test/api/v1.0/courses/${course.code}/wish/`, {
      status: HttpStatusCode.OK,
      body: {
        status: false,
      },
    });
    renderButton(course);

    // wait for JoanieSession initialization
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());
    // wait for CourseAddToWishlist initialization
    await waitFor(() => expect(screen.queryByTestId('spinner')).not.toBeInTheDocument());

    const $notifyButton = screen.getByRole('button', { name: 'Notify me' });
    expect($notifyButton).toBeInTheDocument();

    let nbApiCalls = 3; // JoanieSessionProvider initial requests
    nbApiCalls += 1; // useUserWishlistCourses inital fetch
    expect(fetchMock.calls().length).toBe(nbApiCalls);

    fetchMock.post(`https://joanie.test/api/v1.0/courses/${course.code}/wish/`, HttpStatusCode.OK);
    fetchMock.get(
      `https://joanie.test/api/v1.0/courses/${course.code}/wish/`,
      {
        status: HttpStatusCode.OK,
        body: {
          status: true,
        },
      },
      { overwriteRoutes: true },
    );

    await act(async () => userEvent.click($notifyButton));

    await screen.findByRole('button', { name: 'Do not notify me anymore' });
    expect(screen.queryByRole('button', { name: 'Notify me' })).not.toBeInTheDocument();

    nbApiCalls += 1; // useUserWishlistCourses POST
    nbApiCalls += 1; // useUserWishlistCourses refetching
    expect(fetchMock.calls().length).toBe(nbApiCalls);
  });

  it('renders a "do not notify me" button', async () => {
    fetchMock.get(`https://joanie.test/api/v1.0/courses/${course.code}/wish/`, {
      status: HttpStatusCode.OK,
      body: {
        status: true,
      },
    });
    renderButton(course);

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

    fetchMock.delete(
      `https://joanie.test/api/v1.0/courses/${course.code}/wish/`,
      HttpStatusCode.OK,
    );
    fetchMock.get(
      `https://joanie.test/api/v1.0/courses/${course.code}/wish/`,
      {
        status: HttpStatusCode.OK,
        body: {
          status: false,
        },
      },
      { overwriteRoutes: true },
    );

    await act(async () => userEvent.click($stopNotifyButton));

    expect(await screen.findByRole('button', { name: 'Notify me' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Do not notify me anymore' }),
    ).not.toBeInTheDocument();

    nbApiCalls += 1; // useUserWishlistCourses DELETE
    nbApiCalls += 1; // useUserWishlistCourses refetching
    expect(fetchMock.calls().length).toBe(nbApiCalls);
  });
});
