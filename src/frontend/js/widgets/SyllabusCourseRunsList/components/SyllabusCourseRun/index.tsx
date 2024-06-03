import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { CourseRun, CourseRunDisplayMode } from 'types';
import useDateFormat from 'hooks/useDateFormat';
import { extractResourceId, isJoanieResourceLinkProduct } from 'api/lms/joanie';
import { findLmsBackend } from 'api/configuration';
import { StringHelper } from 'utils/StringHelper';
import { IntlHelper } from 'utils/IntlHelper';
import { DjangoCMSPluginCourseRun, DjangoCMSTemplate } from 'components/DjangoCMSTemplate';
import { CourseLight } from 'types/Joanie';
import CourseRunEnrollment from '../CourseRunEnrollment';
import CourseProductItem from '../CourseProductItem';

const messages = defineMessages({
  enrollment: {
    id: 'components.SyllabusCourseRun.enrollment',
    description: 'Title of the enrollment dates section of an opened course run block',
    defaultMessage: 'Enrollment',
  },
  course: {
    id: 'components.SyllabusCourseRun.course',
    description: 'Title of the course dates section of an opened course run block',
    defaultMessage: 'Course',
  },
  languages: {
    id: 'components.SyllabusCourseRun.languages',
    description: 'Title of the languages section of an opened course run block',
    defaultMessage: 'Languages',
  },
  runPeriod: {
    id: 'components.SyllabusCourseRun.enrollmentPeriod',
    description: 'Enrollment date of an opened course run block',
    defaultMessage: 'From {startDate} {endDate, select, undefined {} other {to {endDate}}}',
  },
  coursePeriod: {
    id: 'components.SyllabusCourseRun.coursePeriod',
    description: 'Course date of an opened course run block',
    defaultMessage: 'From {startDate} {endDate, select, undefined {} other {to {endDate}}}',
  },
});

const OpenedCourseRun = ({ courseRun }: { courseRun: CourseRun }) => {
  const formatDate = useDateFormat();
  const intl = useIntl();
  const enrollmentStart = courseRun.enrollment_start
    ? formatDate(courseRun.enrollment_start)
    : '...';
  const enrollmentEnd = courseRun.enrollment_end ? formatDate(courseRun.enrollment_end) : '...';
  const start = courseRun.start ? formatDate(courseRun.start) : '...';
  const end = courseRun.end ? formatDate(courseRun.end) : '...';
  return (
    <>
      {courseRun.title && <h3>{StringHelper.capitalizeFirst(courseRun.title)}</h3>}
      <dl>
        <dt>
          <FormattedMessage {...messages.enrollment} />
        </dt>
        <dd>
          <FormattedMessage
            {...messages.runPeriod}
            values={{
              startDate: enrollmentStart,
              endDate: enrollmentEnd,
            }}
          />
        </dd>
        <dt>
          <FormattedMessage {...messages.course} />
        </dt>
        <dd>
          <FormattedMessage
            {...messages.runPeriod}
            values={{
              startDate: start,
              endDate: end,
            }}
          />
        </dd>
        <dt>
          <FormattedMessage {...messages.languages} />
        </dt>
        <dd>{IntlHelper.getLocalizedLanguages(courseRun.languages, intl)}</dd>
      </dl>
      {findLmsBackend(courseRun.resource_link) ? (
        <CourseRunEnrollment courseRun={courseRun} />
      ) : (
        <Button className="course-run-enrollment__cta" href={courseRun.resource_link} fullWidth>
          {StringHelper.capitalizeFirst(courseRun.state.call_to_action)}
        </Button>
      )}
    </>
  );
};

export const SyllabusCourseRun = ({
  courseRun,
  course,
}: {
  courseRun: CourseRun;
  course: CourseLight;
}) => {
  return (
    <DjangoCMSTemplate plugin={DjangoCMSPluginCourseRun(courseRun)}>
      <div className="course-detail__run-descriptions course-detail__run-descriptions--course_and_search">
        {isJoanieResourceLinkProduct(courseRun.resource_link) ? (
          <CourseProductItem
            productId={extractResourceId(courseRun.resource_link, 'product')!}
            course={course}
            compact={courseRun.display_mode === CourseRunDisplayMode.COMPACT}
          />
        ) : (
          <OpenedCourseRun courseRun={courseRun} />
        )}
      </div>
    </DjangoCMSTemplate>
  );
};
