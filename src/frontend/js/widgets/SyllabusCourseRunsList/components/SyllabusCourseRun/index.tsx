import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import React from 'react';
import { CourseRun } from 'types';
import useDateFormat from 'hooks/useDateFormat';
import { joinAnd } from 'utils/JoinAnd';
import { Course } from 'types/Course';
import { extractResourceId, isJoanieResourceLinkProduct } from 'api/lms/joanie';
import CourseProductItem from 'widgets/CourseProductItem';
import { findLmsBackend } from 'api/configuration';
import { StringHelper } from 'utils/StringHelper';
import { DjangoCMSPluginCourseRun, DjangoCMSTemplate } from 'components/DjangoCMSTemplate';
import CourseRunEnrollment from 'widgets/SyllabusCourseRunsList/components/CourseRunEnrollment';

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
    defaultMessage: 'From {startDate} to {endDate}',
  },
  coursePeriod: {
    id: 'components.SyllabusCourseRun.coursePeriod',
    description: 'Course date of an opened course run block',
    defaultMessage: 'From {startDate} to {endDate}',
  },
});

const OpenedCourseRun = ({ courseRun }: { courseRun: CourseRun }) => {
  const formatDate = useDateFormat();
  const intl = useIntl();
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
              startDate: formatDate(courseRun.enrollment_start),
              endDate: formatDate(courseRun.enrollment_end),
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
              startDate: formatDate(courseRun.start),
              endDate: formatDate(courseRun.end),
            }}
          />
        </dd>
        <dt>
          <FormattedMessage {...messages.languages} />
        </dt>
        <dd>
          {joinAnd(
            courseRun.languages.map(
              (language) => intl.formatDisplayName(language, { type: 'language' })!,
            ),
            intl,
          )}
        </dd>
      </dl>
      {findLmsBackend(courseRun.resource_link) ? (
        <CourseRunEnrollment courseRun={courseRun} />
      ) : (
        <a className="course-run-enrollment__cta" href={courseRun.resource_link}>
          {StringHelper.capitalizeFirst(courseRun.state.call_to_action)}
        </a>
      )}
    </>
  );
};

export const SyllabusCourseRun = ({
  courseRun,
  course,
}: {
  courseRun: CourseRun;
  course: Course;
}) => {
  return (
    <DjangoCMSTemplate plugin={DjangoCMSPluginCourseRun(courseRun)}>
      <div className="course-detail__run-descriptions course-detail__run-descriptions--course_and_search">
        {isJoanieResourceLinkProduct(courseRun.resource_link) ? (
          <CourseProductItem
            productId={extractResourceId(courseRun.resource_link, 'product')!}
            courseCode={course.code!}
          />
        ) : (
          <OpenedCourseRun courseRun={courseRun} />
        )}
      </div>
    </DjangoCMSTemplate>
  );
};
