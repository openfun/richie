import React from 'react';
import { useIntl, defineMessages, FormattedMessage } from 'react-intl';
import { generatePath } from 'react-router';
import { CourseRun } from 'types';
import useCourseEnrollment from 'widgets/SyllabusCourseRunsList/hooks/useCourseEnrollment';
import CourseRunItem from 'widgets/SyllabusCourseRunsList/components/CourseRunItem';
import { getDashboardBasename } from 'widgets/Dashboard/hooks/useDashboardRouter/getDashboardBasename';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import useCourseRunOrder from 'hooks/useCourseRunOrder';
import { Spinner } from 'components/Spinner';
import { OrderHelper } from 'utils/OrderHelper';
import { extractResourceMetadata } from 'api/lms/joanie';

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
  const resourceLinkResources = extractResourceMetadata(item.resource_link);
  const isProduct = !!(resourceLinkResources?.course && resourceLinkResources?.product);
  const {
    item: order,
    states: { isFetched },
  } = useCourseRunOrder(item);
  const courseUrl = order
    ? `${getDashboardBasename(intl.locale)}${generatePath(LearnerDashboardPaths.ORDER, { orderId: order.id })}`
    : item.resource_link;

  const { enrollmentIsActive: courseRunEnrollmentIsActive } = useCourseEnrollment(
    item.resource_link,
    !isProduct,
  );

  // user is enrolled to a product if there is an active order for the product
  const orderIsActive = OrderHelper.isActive(order);
  const enrollmentIsActive = !!(courseRunEnrollmentIsActive || orderIsActive);

  if (!isFetched) {
    return <Spinner />;
  }

  return (
    <>
      {enrollmentIsActive ? (
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
