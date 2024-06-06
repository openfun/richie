import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { CourseRun, CourseRunDisplayMode, PacedCourse } from 'types';
import useDateFormat from 'hooks/useDateFormat';
import { extractResourceId, isJoanieResourceLinkProduct } from 'api/lms/joanie';
import { findLmsBackend } from 'api/configuration';
import { StringHelper } from 'utils/StringHelper';
import { IntlHelper } from 'utils/IntlHelper';
import { DjangoCMSPluginCourseRun, DjangoCMSTemplate } from 'components/DjangoCMSTemplate';
import CourseRunEnrollment from '../CourseRunEnrollment';
import CourseProductItem from '../CourseProductItem';

const messages = defineMessages({
  course: {
    id: 'components.SyllabusCourseRunCompacted.course',
    description: 'Title of the course dates section of an opened course run block',
    defaultMessage: 'Course',
  },
  languages: {
    id: 'components.SyllabusCourseRunCompacted.languages',
    description: 'Title of the languages section of an opened course run block',
    defaultMessage: 'Languages',
  },
  selfPaceRunPeriod: {
    id: 'components.SyllabusCourseRunCompacted.selfPaceCoursePeriod',
    description: 'Course date of an opened and self paced course run block',
    defaultMessage: 'Available until {endDate}',
  },
  selfPaceNoEndDate: {
    id: 'components.SyllabusCourseRunCompacted.selfPaceNoEndDate',
    description: 'Self paced course run block with no end date',
    defaultMessage: 'Available',
  },
});

const OpenedSelfPacedCourseRun = ({
  courseRun,
  showLanguages,
}: {
  courseRun: CourseRun;
  showLanguages: boolean;
}) => {
  const formatDate = useDateFormat();
  const intl = useIntl();
  const end = courseRun.end ? formatDate(courseRun.end) : '...';
  const hasEndDate = end !== '...';
  return (
    <>
      {courseRun.title && <h3>{StringHelper.capitalizeFirst(courseRun.title)}</h3>}
      <dl>
        {!showLanguages && (
          <dt>
            <FormattedMessage {...messages.course} />
          </dt>
        )}
        <dd>
          {hasEndDate ? (
            <FormattedMessage
              {...messages.selfPaceRunPeriod}
              values={{
                endDate: end,
              }}
            />
          ) : (
            <FormattedMessage {...messages.selfPaceNoEndDate} />
          )}
        </dd>
        {!showLanguages && (
          <>
            <dt>
              <FormattedMessage {...messages.languages} />
            </dt>
            <dd>{IntlHelper.getLocalizedLanguages(courseRun.languages, intl)}</dd>
          </>
        )}
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

export const SyllabusCourseRunCompacted = ({
  courseRun,
  course,
  showLanguages,
}: {
  courseRun: CourseRun;
  course: PacedCourse;
  showLanguages: boolean;
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
          <OpenedSelfPacedCourseRun courseRun={courseRun} showLanguages={showLanguages} />
        )}
      </div>
    </DjangoCMSTemplate>
  );
};
