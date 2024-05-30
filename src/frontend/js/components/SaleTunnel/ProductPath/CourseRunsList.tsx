import { PropsWithChildren } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import * as Joanie from 'types/Joanie';
import useDateFormat from 'hooks/useDateFormat';
import { IntlHelper } from 'utils/IntlHelper';
import EnrollmentDate from 'components/EnrollmentDate';

const messages = defineMessages({
  availableCourseRuns: {
    defaultMessage: `{
count,
plural,
=0 {No course runs}
one {One course run}
other {# course runs}
} available`,
    description: 'Course runs available text',
    id: 'components.SaleTunnelStepValidation.availableCourseRuns',
  },
  courseRunDates: {
    defaultMessage: 'From {start} {end, select, undefined {} other {to {end}}}',
    description: 'Course run date text',
    id: 'components.SaleTunnelStepValidation.courseRunDates',
  },
  noCourseRunAvailable: {
    defaultMessage: 'No session available for this course.',
    description: 'Text displayed when no course run are opened for the course',
    id: 'components.SaleTunnelStepValidation.noCourseRunAvailable',
  },
  language: {
    defaultMessage: `{
count,
plural,
one {Language:}
other {Languages:}
}`,
    description: 'Label displayed before the list of languages',
    id: 'components.SaleTunnelStepValidation.language',
  },
});

const CourseRunsList = ({ courseRuns }: PropsWithChildren<{ courseRuns: Joanie.CourseRun[] }>) => {
  const intl = useIntl();
  const formatDate = useDateFormat({ month: 'long' });

  if (courseRuns.length === 0) {
    return (
      <div className="product-detail-row__content product-detail-row__course-run-dates">
        <p className="product-detail-row__course-run-dates__count">
          <svg role="img" width="24">
            <use href="#icon-warning" />
          </svg>
          <FormattedMessage {...messages.noCourseRunAvailable} />
        </p>
      </div>
    );
  }

  return (
    <div className="product-detail-row__content product-detail-row__course-run-dates">
      <p className="product-detail-row__course-run-dates__count">
        <svg role="img" width="24">
          <use href="#icon-calendar" />
        </svg>
        <FormattedMessage {...messages.availableCourseRuns} values={{ count: courseRuns.length }} />
      </p>
      <ul className="product-detail-row__course-run-dates__list">
        {courseRuns.map((courseRun) => (
          <li
            className="product-detail-row__course-run-dates__item"
            key={courseRun.id}
            data-testid="course-run-list-item"
          >
            <FormattedMessage
              {...messages.courseRunDates}
              values={{
                start: formatDate(courseRun.start),
                end: formatDate(courseRun.end),
              }}
            />
            <span className="course-run__metadata">
              <EnrollmentDate
                enrollment_start={courseRun.enrollment_start}
                enrollment_end={courseRun.enrollment_end}
                formatOptions={{ month: 'long' }}
              />
            </span>
            <span className="course-run__metadata">
              <FormattedMessage
                {...messages.language}
                values={{ count: courseRun.languages.length }}
              />{' '}
              {IntlHelper.getLocalizedLanguages(courseRun.languages, intl)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseRunsList;
