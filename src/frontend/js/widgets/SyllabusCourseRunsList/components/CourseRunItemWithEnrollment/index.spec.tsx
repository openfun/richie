import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { BaseAppWrapper } from 'utils/test/wrappers/BaseAppWrapper';
import { render } from 'utils/test/render';
import CourseRunItemWithEnrollment from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    lms_backends: [
      {
        backend: 'openedx-dogwood',
        endpoint: 'https://edx.com',
        course_regexp: '(.*)',
      },
    ],
  }).one(),
}));

describe('CourseRunItemWithEnrollment', () => {
  it('should not render enrollment information when user is anonymous', async () => {
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
    }).one();

    render(<CourseRunItemWithEnrollment item={courseRun} />, {
      wrapper: BaseAppWrapper,
      queryOptions: { client: createTestQueryClient({ user: null }) },
    });
    // session loader
    await waitFor(() => {
      expect(screen.queryByText('loading...')).not.toBeInTheDocument();
    });

    // First title letter should have been capitalized
    // Dates should have been formatted as "Month day, year"
    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
    expect(fetchMock.called()).toBe(false);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should not render enrollment information when user is not enrolled to the course run', async () => {
    const user = UserFactory().one();
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
    }).one();

    fetchMock.get(
      `https://edx.com/api/enrollment/v1/enrollment/${user.username},${courseRun.resource_link}`,
      {
        title: courseRun.title,
        is_active: false,
      },
    );

    render(<CourseRunItemWithEnrollment item={courseRun} />, {
      wrapper: BaseAppWrapper,
      queryOptions: { client: createTestQueryClient({ user }) },
    });
    // session loader
    await waitFor(() => {
      expect(screen.queryByText('loading...')).not.toBeInTheDocument();
    });

    // Only dates should have been displayed.
    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
    expect(fetchMock.called()).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Go to course' })).not.toBeInTheDocument();
    });
    expect(screen.queryByLabelText('You are enrolled in this course run')).not.toBeInTheDocument();
  });

  it('should render enrollment information when user is enrolled to the course run', async () => {
    const user = UserFactory().one();
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
    }).one();

    fetchMock.get(
      `https://edx.com/api/enrollment/v1/enrollment/${user.username},${courseRun.resource_link}`,
      {
        title: courseRun.title,
        is_active: true,
      },
    );

    render(<CourseRunItemWithEnrollment item={courseRun} />, {
      wrapper: BaseAppWrapper,
      queryOptions: { client: createTestQueryClient({ user }) },
    });
    // session loader
    await waitFor(() => {
      expect(screen.queryByText('loading...')).not.toBeInTheDocument();
    });

    // Only dates should have been displayed.
    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
    expect(fetchMock.called()).toBeTruthy();

    const link = (await screen.findByRole('link')) as HTMLAnchorElement;
    expect(link.title).toEqual('Go to course');
    expect(link.href.startsWith(courseRun.resource_link)).toBe(true);
    screen.getByLabelText('You are enrolled in this course run');
  });
});
