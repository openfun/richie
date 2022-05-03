import { defineMessages, useIntl } from 'react-intl';

import { Icon } from 'components/Icon';
import { CommonDataProps } from 'types/commonDataProps';
import { Course } from 'types/Course';

const messages = defineMessages({
  dateIconAlt: {
    defaultMessage: 'Course date',
    description: 'Course date logo alternative text for screen reader users',
    id: 'components.CourseGlimpseFooter.dateIconAlt',
  },
});

/**
 * <CourseGlimpseFooter />.
 * This is spun off from <CourseGlimpse /> to allow easier override through webpack.
 */
export const CourseGlimpseFooter: React.FC<{ course: Course } & CommonDataProps> = ({ course }) => {
  const intl = useIntl();
  return (
    <div className="course-glimpse-footer">
      <div className="course-glimpse-footer__date">
        <Icon name="icon-calendar" title={intl.formatMessage(messages.dateIconAlt)} />
        {course.state.text.charAt(0).toUpperCase() +
          course.state.text.substr(1) +
          (course.state.datetime
            ? ` ${intl.formatDate(new Date(course.state.datetime!), {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}`
            : '')}
      </div>
    </div>
  );
};
