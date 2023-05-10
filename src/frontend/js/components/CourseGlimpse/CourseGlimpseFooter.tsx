import { defineMessages, useIntl } from 'react-intl';

import { Icon, IconTypeEnum } from 'components/Icon';
import { CommonDataProps } from 'types/commonDataProps';
import { CourseState } from 'types';

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
export const CourseGlimpseFooter: React.FC<{ courseState: CourseState } & CommonDataProps> = ({
  courseState,
}) => {
  const intl = useIntl();
  return (
    <div className="course-glimpse-footer">
      <div className="course-glimpse-footer__date">
        <Icon name={IconTypeEnum.CALENDAR} title={intl.formatMessage(messages.dateIconAlt)} />
        {courseState.text.charAt(0).toUpperCase() +
          courseState.text.substr(1) +
          (courseState.datetime
            ? ` ${intl.formatDate(new Date(courseState.datetime!), {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}`
            : '')}
      </div>
    </div>
  );
};
