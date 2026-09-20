import { screen } from '@testing-library/react';
import { CourseRun } from 'types';
import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import context from 'utils/context';
import { render } from 'utils/test/render';
import { BaseAppWrapper } from 'utils/test/wrappers/BaseAppWrapper';
import ExternalCourseRunEnrollment from './index';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    enrollment_awareness_rules: [
      {
        id: 'external-platform',
        when: { is_external: true },
        cta: { enroll: 'Enroll on the partner platform' },
        message: { variant: 'warning', text: 'This course runs on another platform.' },
      },
    ],
  }).one(),
}));

describe('<ExternalCourseRunEnrollment />', () => {
  const buildCourseRun = (callToAction: CourseRun['state']['call_to_action']): CourseRun => {
    const courseRun: CourseRun = CourseRunFactory().one();
    courseRun.resource_link = 'https://external.platform/course/';
    courseRun.state.call_to_action = callToAction;
    return courseRun;
  };

  it('renders the awareness label and message on the "enroll now" CTA', () => {
    render(<ExternalCourseRunEnrollment courseRun={buildCourseRun('enroll now')} />, {
      wrapper: BaseAppWrapper,
    });

    const link = screen.getByRole('link', { name: 'Enroll on the partner platform' });
    expect(link).toHaveAttribute('href', 'https://external.platform/course/');
    expect(screen.getByRole('alert')).toHaveTextContent('This course runs on another platform.');
  });

  it('keeps the "study now" CTA but still renders the message', () => {
    render(<ExternalCourseRunEnrollment courseRun={buildCourseRun('study now')} />, {
      wrapper: BaseAppWrapper,
    });

    screen.getByRole('link', { name: 'Study now' });
    screen.getByText('This course runs on another platform.');
  });

  describe('without enrollment awareness rules', () => {
    const rules = context.enrollment_awareness_rules;

    beforeEach(() => {
      context.enrollment_awareness_rules = undefined;
    });

    afterEach(() => {
      context.enrollment_awareness_rules = rules;
    });

    it('renders the default "enroll now" CTA and no message', () => {
      render(<ExternalCourseRunEnrollment courseRun={buildCourseRun('enroll now')} />, {
        wrapper: BaseAppWrapper,
      });

      const link = screen.getByRole('link', { name: 'Enroll now' });
      expect(link).toHaveAttribute('href', 'https://external.platform/course/');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('renders the default "study now" CTA and no message', () => {
      render(<ExternalCourseRunEnrollment courseRun={buildCourseRun('study now')} />, {
        wrapper: BaseAppWrapper,
      });

      const link = screen.getByRole('link', { name: 'Study now' });
      expect(link).toHaveAttribute('href', 'https://external.platform/course/');
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });
});
