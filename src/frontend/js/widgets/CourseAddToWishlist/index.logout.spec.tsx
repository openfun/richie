/**
 * Test suite for CourseAddToWishlist component
 * for anonymous visitors
 */
import { render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { UserWishlistCourseFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { SessionProvider } from 'contexts/SessionContext';
import { location } from 'utils/indirection/window';
import CourseAddToWishlist from '.';

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
      endpoint: 'https://joanie.test',
    },
  }).generate(),
}));

const renderCourseAddToWishlist = (courseCode: string) =>
  render(
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: null })}>
        <JoanieApiProvider>
          <SessionProvider>
            <CourseAddToWishlist courseCode={courseCode} />
          </SessionProvider>
        </JoanieApiProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );

describe('CourseAddToWishlist', () => {
  const wishlistCourse = UserWishlistCourseFactory.generate();

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders a log me link', async () => {
    renderCourseAddToWishlist(wishlistCourse.course_code);
    // wait for JoanieSession initialization
    await waitFor(() => expect(screen.queryByText('loading...')).not.toBeInTheDocument());

    const $logMeButton = await screen.findByRole('button', { name: 'Log in to be notified' });
    expect($logMeButton).toBeInTheDocument();

    await userEvent.click($logMeButton);

    expect(location.assign).toHaveBeenCalledWith(
      `https://authentication.test/login?next=richie/tests/CourseAddToWishlist/`,
    );
  });
});
