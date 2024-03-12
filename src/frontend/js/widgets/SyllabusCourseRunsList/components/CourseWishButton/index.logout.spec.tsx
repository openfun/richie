/**
 * Test suite for CourseAddToWishlist component
 * for anonymous visitors
 */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { location } from 'utils/indirection/window';
import { CourseLightFactory } from 'utils/test/factories/joanie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import CourseWishButton from '.';

jest.mock('utils/indirection/window', () => ({
  location: {
    pathname: '/tests/CourseAddToWishlist/',
    assign: jest.fn(() => true),
  },
}));

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
  setupJoanieSession();
  const course = CourseLightFactory().one();

  it('renders a log me link', async () => {
    fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`, {
      status: HttpStatusCode.OK,
      body: {
        status: false,
      },
    });

    render(<CourseWishButton course={course} />, {
      queryOptions: { client: createTestQueryClient({ user: null }) },
    });
    // wait for JoanieSession initialization
    await expectNoSpinner();

    const $logMeButton = await screen.findByRole('button', { name: 'Log in to be notified' });
    expect($logMeButton).toBeInTheDocument();

    await userEvent.click($logMeButton);

    expect(location.assign).toHaveBeenCalledWith(
      `https://authentication.test/login?next=richie/tests/CourseAddToWishlist/`,
    );
  });
});
