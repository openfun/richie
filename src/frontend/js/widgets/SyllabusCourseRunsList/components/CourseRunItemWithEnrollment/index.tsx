import React from 'react';
import { useIntl, defineMessages, FormattedMessage } from 'react-intl';
import { generatePath } from 'react-router-dom';
import { CourseRun } from 'types';
import useCourseEnrollment from 'widgets/SyllabusCourseRunsList/hooks/useCourseEnrollment';
import CourseRunItem from 'widgets/SyllabusCourseRunsList/components/CourseRunItem';
import { getDashboardBasename } from 'widgets/Dashboard/hooks/useDashboardRouter/getDashboardBasename';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import useCourseRunOrder from 'hooks/useCourseRunOrder';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  goToCourse: {
    defaultMessage: 'Go to course',
    description: 'Link title for users to go to the course run in which they are enrolled.',
    id: 'components.CourseRunItemWithEnrollment.goToCourse',
  },
  enrolledAriaLabel: {
    defaultMessage: 'You are enrolled in this course run',
    description: 'Help text for users are enrolled in the course run.',
    id: 'components.CourseRunItemWithEnrollment.enrolledAriaLabel',
  },
  enrolled: {
    defaultMessage: 'Enrolled',
    description: 'Help text for users are enrolled in the course run.',
    id: 'components.CourseRunItemWithEnrollment.enrolled',
  },
});

type Props = {
  item: CourseRun;
};

const CourseRunItemWithEnrollment = ({ item }: Props) => {
  const intl = useIntl();
  const {
    item: order,
    states: { isFetched },
  } = useCourseRunOrder(item);
  const courseUrl = order
    ? `${getDashboardBasename(intl.locale)}${generatePath(LearnerDashboardPaths.ORDER, { orderId: order.id })}`
    : item.resource_link;

  const { enrollmentIsActive: courseRunEnrollmentIsActive } = useCourseEnrollment(
    item.resource_link,
    isFetched && !order,
  );

  // user is enroll to a product if any of the product's target course have a active enrollment
  const productEnrollmentIsActive = order?.target_enrollments.some((enrollment) => {
    return enrollment.is_active;
  });
  const enrollmentIsActive = !!(courseRunEnrollmentIsActive || productEnrollmentIsActive);

  if (!isFetched) {
    return <Spinner />;
  }

  return (
    <>
      {enrollmentIsActive || !!order ? (
        // eslint-disable-next-line jsx-a11y/control-has-associated-label
        <a href={courseUrl} title={intl.formatMessage(messages.goToCourse)}>
          <CourseRunItem item={item} />
        </a>
      ) : (
        <CourseRunItem item={item} />
      )}
      {enrollmentIsActive && (
        <p className="category-tag" aria-label={intl.formatMessage(messages.enrolledAriaLabel)}>
          <FormattedMessage {...messages.enrolled} />
        </p>
      )}
    </>
  );
};

export default CourseRunItemWithEnrollment;
