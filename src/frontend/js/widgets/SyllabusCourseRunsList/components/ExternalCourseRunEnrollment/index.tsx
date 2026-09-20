import { useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { CourseRun } from 'types';
import context from 'utils/context';
import { getEnrollmentAwareness } from 'utils/enrollmentAwareness';
import EnrollmentAwarenessMessages from 'components/EnrollmentAwarenessMessages';

const messages = defineMessages({
  enrollNow: {
    id: 'components.SyllabusCourseRun.enrollNow',
    description: 'CTA for users to enroll on ongoing of future open course.',
    defaultMessage: 'Enroll now',
  },
  studyNow: {
    id: 'components.SyllabusCourseRun.studyNow',
    description: 'CTA for users to enroll on archived course.',
    defaultMessage: 'Study now',
  },
});

interface ExternalCourseRunEnrollmentProps {
  courseRun: CourseRun;
}

/**
 * Call to action for a course run that is not handled by any configured LMS backend: a plain
 * link to the course run resource, with the enrollment awareness rules applied.
 */
const ExternalCourseRunEnrollment = ({ courseRun }: ExternalCourseRunEnrollmentProps) => {
  const awareness = useMemo(
    () =>
      getEnrollmentAwareness(context.enrollment_awareness_rules, courseRun, { isExternal: true }),
    [courseRun],
  );

  return (
    <>
      <Button className="course-run-enrollment__cta" href={courseRun.resource_link} fullWidth>
        {courseRun.state.call_to_action === 'enroll now'
          ? (awareness.enrollLabel ?? <FormattedMessage {...messages.enrollNow} />)
          : null}
        {courseRun.state.call_to_action === 'study now' ? (
          <FormattedMessage {...messages.studyNow} />
        ) : null}
      </Button>
      <EnrollmentAwarenessMessages messages={awareness.messages} />
    </>
  );
};

export default ExternalCourseRunEnrollment;
