import { act, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { CourseRun } from 'types';
import { Deferred } from 'utils/test/deferred';
import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import { BaseAppWrapper } from 'utils/test/wrappers/BaseAppWrapper';
import { render } from 'utils/test/render';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import CourseRunEnrollment from './index';

jest.mock('utils/errors/handle');

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      endpoint: 'https://demo.endpoint',
      backend: 'openedx-hawthorn',
    },
    lms_backends: [
      {
        backend: 'openedx-hawthorn',
        course_regexp: '(https://openedx.endpoint.*)',
        endpoint: 'https://demo.endpoint',
      },
    ],
    enrollment_awareness_rules: [
      {
        id: 'free-course',
        when: { offer: ['free'] },
        cta: { enroll: 'Enroll now for free', login: 'Log in to enroll for free' },
      },
      {
        id: 'paid-certificate',
        when: { certificate_offer: ['paid'] },
        message: { variant: 'info', text: 'A certificate is available for a fee.' },
      },
      {
        id: 'external-platform',
        when: { is_external: true },
        message: { variant: 'warning', text: 'This course runs on another platform.' },
      },
    ],
  }).one(),
}));

describe('<CourseRunEnrollment /> with enrollment awareness rules', () => {
  const endpoint = 'https://demo.endpoint';

  const buildCourseRun = (overrides: Partial<CourseRun>): CourseRun => {
    const courseRun: CourseRun = CourseRunFactory().one();
    courseRun.state.priority = 0;
    courseRun.resource_link = 'https://openedx.endpoint' + courseRun.resource_link;
    return { ...courseRun, ...overrides };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('applies the matching labels and messages for a logged in user', async () => {
    const user: User = UserFactory().one();
    const courseRun = buildCourseRun({ offer: 'free', certificate_offer: 'paid' });

    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${user.username},${courseRun.resource_link}`,
      enrollmentsDeferred.promise,
    );

    render(<CourseRunEnrollment courseRun={courseRun} />, {
      wrapper: BaseAppWrapper,
      queryOptions: { client: createTestQueryClient({ user }) },
    });
    await expectSpinner('Loading enrollment information...');
    await act(async () => {
      enrollmentsDeferred.resolve({});
    });
    await expectNoSpinner('Loading enrollment information...');

    screen.getByRole('button', { name: 'Enroll now for free' });
    screen.getByText('A certificate is available for a fee.');
    // The external rule does not match a course run handled by an LMS backend
    expect(screen.queryByText('This course runs on another platform.')).not.toBeInTheDocument();
  });

  it('applies the matching login label for an anonymous user', async () => {
    const courseRun = buildCourseRun({ offer: 'free', certificate_offer: 'free' });

    render(<CourseRunEnrollment courseRun={courseRun} />, {
      wrapper: BaseAppWrapper,
      queryOptions: { client: createTestQueryClient({ user: null }) },
    });

    await screen.findByRole('button', { name: 'Log in to enroll for free' });
    expect(screen.queryByText('A certificate is available for a fee.')).not.toBeInTheDocument();
  });

  it('keeps the default labels when no rule matches', async () => {
    const courseRun = buildCourseRun({ offer: 'paid', certificate_offer: 'free' });

    render(<CourseRunEnrollment courseRun={courseRun} />, {
      wrapper: BaseAppWrapper,
      queryOptions: { client: createTestQueryClient({ user: null }) },
    });

    await screen.findByRole('button', { name: 'Log in to enroll' });
    expect(document.querySelector('.enrollment-awareness')).toBeNull();
  });
});
