import React from 'react';
import { useIntl, defineMessages, FormattedMessage } from 'react-intl';
import { CourseRun } from 'types';
import useCourseEnrollment from 'widgets/SyllabusCourseRunsList/hooks/useCourseEnrollment';
import CourseRunItem from 'widgets/SyllabusCourseRunsList/components/CourseRunItem';

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
  const { enrollmentIsActive } = useCourseEnrollment(item.resource_link);

  return (
    <>
      {enrollmentIsActive ? (
        // eslint-disable-next-line jsx-a11y/control-has-associated-label
        <a href={item.resource_link} title={intl.formatMessage(messages.goToCourse)}>
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
