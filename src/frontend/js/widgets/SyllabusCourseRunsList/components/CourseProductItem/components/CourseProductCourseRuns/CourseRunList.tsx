import { Children } from 'react';
import { useIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Icon, IconTypeEnum } from 'components/Icon';
import type * as Joanie from 'types/Joanie';
import useDateFormat from 'hooks/useDateFormat';
import { IntlHelper } from 'utils/IntlHelper';
import EnrollmentDate from 'components/EnrollmentDate';
import { messages as sharedMessages } from '../CourseRunItem';
import CourseRunSection, { messages as sectionMessages } from './CourseRunSection';

const messages = defineMessages({
  noCourseRunAvailable: {
    defaultMessage: 'No session available for this course.',
    description: 'Text displayed when no course run are opened for the course',
    id: 'components.CourseRunList.noCourseRunAvailable',
  },
});

interface Props {
  courseRuns: Joanie.CourseRun[];
}

const CourseRunList = ({ courseRuns }: Props) => {
  const intl = useIntl();
  const formatDate = useDateFormat();

  if (courseRuns.length === 0) {
    return (
      <p className="course-runs-not-available product-widget__item-description">
        <Icon name={IconTypeEnum.WARNING} size="small" />
        <FormattedMessage {...messages.noCourseRunAvailable} />
      </p>
    );
  }

  return (
    <CourseRunSection>
      <ol className="course-runs-list">
        {Children.toArray(
          courseRuns.map((courseRun) => (
            <li className="course-runs-item course-runs-item--inactive">
              <strong className="course-runs-item__course-dates">
                <span
                  className="offscreen"
                  data-testid={`course-run-${courseRun.id}-offscreen-start-date`}
                >
                  <FormattedMessage {...sectionMessages.start} />
                </span>
                <em
                  data-testid={`course-run-${courseRun.id}-start-date`}
                  className="course-runs-item__date course-runs-item__date--start"
                >
                  {formatDate(courseRun.start)}
                </em>
                <span className="course-runs-item__date-separator" />
                <span
                  className="offscreen"
                  data-testid={`course-run-${courseRun.id}-offscreen-end-date`}
                >
                  <FormattedMessage {...sectionMessages.end} />
                </span>
                <em
                  data-testid={`course-run-${courseRun.id}-end-date`}
                  className="course-runs-item__date course-runs-item__date--end"
                >
                  {formatDate(courseRun.end)}
                </em>
              </strong>
              <span
                data-testid={`course-run-${courseRun.id}-enrollment-dates`}
                className="course-runs-item__metadata"
              >
                <EnrollmentDate
                  enrollment_start={courseRun.enrollment_start}
                  enrollment_end={courseRun.enrollment_end}
                />
              </span>
              <span
                data-testid={`course-run-${courseRun.id}-languages`}
                className="course-runs-item__metadata"
              >
                <FormattedMessage
                  {...sharedMessages.language}
                  values={{ count: courseRun.languages.length }}
                />{' '}
                {IntlHelper.getLocalizedLanguages(courseRun.languages, intl)}
              </span>
            </li>
          )),
        )}
      </ol>
    </CourseRunSection>
  );
};

export default CourseRunList;
