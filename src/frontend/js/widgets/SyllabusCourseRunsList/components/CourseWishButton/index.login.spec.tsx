/**
 * Test suite for CourseAddToWishlist component
 * for logged visitors
 */
import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { CourseLightFactory } from 'utils/test/factories/joanie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import CourseWishButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      backend: 'fonzie',
      endpoint: 'https://authentication.test',
    },
    joanie_backend: {
      endpoint: 'https://joanie.endpoint',
    },
  }).one(),
}));

describe('CourseWishButton', () => {
  const joanieSessionData = setupJoanieSession();
  let nbApiCalls: number;
  const course = CourseLightFactory().one();

  beforeEach(() => {
    nbApiCalls = joanieSessionData.nbSessionApiRequest;
  });

  it('renders a notify me button', async () => {
    fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`, {
      status: HttpStatusCode.OK,
      body: {
        status: false,
      },
    });
    render(<CourseWishButton course={course} />);

    // wait for CourseAddToWishlist initialization
    await expectNoSpinner();

    const $notifyButton = screen.getByRole('button', { name: 'Notify me' });
    expect($notifyButton).toBeInTheDocument();

    nbApiCalls += 1; // useUserWishlistCourses inital fetch
    expect(fetchMock.calls().length).toBe(nbApiCalls);

    fetchMock.post(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`,
      HttpStatusCode.OK,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`,
      {
        status: HttpStatusCode.OK,
        body: {
          status: true,
        },
      },
      { overwriteRoutes: true },
    );

    await userEvent.click($notifyButton);

    await screen.findByRole('button', { name: 'Do not notify me anymore' });
    expect(screen.queryByRole('button', { name: 'Notify me' })).not.toBeInTheDocument();

    nbApiCalls += 1; // useUserWishlistCourses POST
    nbApiCalls += 1; // useUserWishlistCourses refetching
    expect(fetchMock.calls().length).toBe(nbApiCalls);
  });

  it('renders a "do not notify me" button', async () => {
    fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`, {
      status: HttpStatusCode.OK,
      body: {
        status: true,
      },
    });
    render(<CourseWishButton course={course} />);

    // wait for CourseAddToWishlist initialization
    await expectNoSpinner();

    const $stopNotifyButton = await screen.findByRole('button', {
      name: 'Do not notify me anymore',
    });
    expect($stopNotifyButton).toBeInTheDocument();

    nbApiCalls += 1; // useUserWishlistCourses inital fetch
    expect(fetchMock.calls().length).toBe(nbApiCalls);

    // We dont care about POST request return values,
    // react-query will refetch data using the GET url.

    fetchMock.delete(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`,
      HttpStatusCode.OK,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`,
      {
        status: HttpStatusCode.OK,
        body: {
          status: false,
        },
      },
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
