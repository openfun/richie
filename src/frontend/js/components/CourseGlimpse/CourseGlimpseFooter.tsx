import { useIntl } from 'react-intl';

import { Icon } from 'components/Icon';
import { CommonDataProps } from 'types/commonDataProps';
import { Course } from 'types/Course';

/**
 * <CourseGlimpseFooter />.
 * This is spun off from <CourseGlimpse /> to allow easier override through webpack.
 */
export const CourseGlimpseFooter: React.FC<{ course: Course } & CommonDataProps> = ({ course }) => {
  const intl = useIntl();
  return (
    <div className="course-glimpse-footer">
      <div className="course-glimpse-footer__date">
        <Icon name="icon-calendar" />
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
