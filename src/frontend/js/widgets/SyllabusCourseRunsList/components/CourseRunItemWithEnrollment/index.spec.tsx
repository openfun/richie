import { render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
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
  const Wrapper = ({ client, children }: PropsWithChildren<{ client?: QueryClient }>) => {
    return (
      <QueryClientProvider client={client ?? createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <BaseSessionProvider>{children}</BaseSessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    fetchMock.restore();
  });

  it('should not render enrollment information when user is anonymous', () => {
    const courseRun = CourseRunFactory({
      title: 'run',
      start: new Date('2023-01-01').toISOString(),
      end: new Date('2023-12-31').toISOString(),
    }).one();

    render(
      <Wrapper client={createTestQueryClient({ user: null })}>
        <CourseRunItemWithEnrollment item={courseRun} />
      </Wrapper>,
    );

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

    render(
      <Wrapper client={createTestQueryClient({ user })}>
        <CourseRunItemWithEnrollment item={courseRun} />
      </Wrapper>,
    );

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

    render(
      <Wrapper client={createTestQueryClient({ user })}>
        <CourseRunItemWithEnrollment item={courseRun} />
      </Wrapper>,
    );

    // Only dates should have been displayed.
    screen.getByText('Run, from Jan 01, 2023 to Dec 31, 2023');
    expect(fetchMock.called()).toBeTruthy();

    const link = (await screen.findByRole('link')) as HTMLAnchorElement;
    expect(link.title).toEqual('Go to course');
    expect(link.href.startsWith(courseRun.resource_link)).toBe(true);
    screen.getByLabelText('You are enrolled in this course run');
  });
});
