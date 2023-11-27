import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import React from 'react';
import { CourseRun, Priority } from 'types';
import { SyllabusSimpleCourseRunsList } from 'widgets/SyllabusCourseRunsList/components/SyllabusSimpleCourseRunsList';
import { SyllabusCourseRun } from 'widgets/SyllabusCourseRunsList/components/SyllabusCourseRun';
import { CourseLight } from 'types/Joanie';

const messages = defineMessages({
  otherCourseRuns: {
    id: 'components.SyllabusAsideList.otherCourseRuns',
    description:
      'Message displayed on the top of course runs list on syllabus when there is only one course run opened',
    defaultMessage: 'Other course runs',
  },
  courseRunsTitle: {
    id: 'components.SyllabusAsideList.courseRunsTitle',
    description:
      'Message displayed on the top of course runs list on syllabus when there is 0 or multiple course runs opened',
    defaultMessage: 'Course runs',
  },
  noCourseRuns: {
    id: 'components.SyllabusAsideList.noCourseRuns',
    description: 'Message displayed on syllabus when there are no course runs to show',
    defaultMessage: 'No course runs',
  },
  noOtherCourseRuns: {
    id: 'components.SyllabusAsideList.noOtherCourseRuns',
    description:
      'Message displayed on syllabus when there are no other course runs to show than the only one opened',
    defaultMessage: 'No other course runs',
  },
  toBeScheduled: {
    id: 'components.SyllabusAsideList.toBeScheduled',
    description: 'Message displayed on syllabus when there are course runs to be scheduled',
    defaultMessage: 'To be scheduled',
  },
  upcoming: {
    id: 'components.SyllabusAsideList.upcoming',
    description: 'Message displayed on syllabus when there are upcoming course runs',
    defaultMessage: 'Upcoming',
  },
  ongoing: {
    id: 'components.SyllabusAsideList.ongoing',
    description: 'Message displayed on syllabus when there are ongoing course runs',
    defaultMessage: 'Ongoing',
  },
  archived: {
    id: 'components.SyllabusAsideList.archived',
    description: 'Message displayed on syllabus when there are archived course runs',
    defaultMessage: 'Archived',
  },
});

export const SyllabusAsideList = ({
  courseRuns,
  course,
  maxArchivedCourseRuns,
}: {
  courseRuns: CourseRun[];
  course: CourseLight;
  maxArchivedCourseRuns: number;
}) => {
  const intl = useIntl();
  const locale = intl.locale.split('-')[0];

  const openedRuns = courseRuns
    .filter((run) =>
      [Priority.ONGOING_OPEN, Priority.FUTURE_OPEN, Priority.ARCHIVED_OPEN].includes(
        run.state.priority,
      ),
    )
    .sort((a, b) => {
      // Sort the runs with the same locale as the user above.
      if (a.languages.includes(locale) && !b.languages.includes(locale)) {
        return -1;
      }
      if (!a.languages.includes(locale) && b.languages.includes(locale)) {
        return 1;
      }
      return Date.parse(a.start) - Date.parse(b.start);
    });

  const otherRuns = courseRuns.filter((run) =>
    [
      Priority.TO_BE_SCHEDULED,
      Priority.FUTURE_NOT_YET_OPEN,
      Priority.FUTURE_CLOSED,
      Priority.ONGOING_CLOSED,
      Priority.ARCHIVED_CLOSED,
    ].includes(run.state.priority),
  );

  const toBeScheduledRuns = otherRuns.filter((run) =>
    [Priority.TO_BE_SCHEDULED].includes(run.state.priority),
  );

  const upcomingRuns = otherRuns.filter((run) =>
    [Priority.FUTURE_NOT_YET_OPEN].includes(run.state.priority),
  );

  const ongoingRuns = otherRuns.filter((run) =>
    [Priority.FUTURE_CLOSED, Priority.ONGOING_CLOSED].includes(run.state.priority),
  );

  const archivedRuns = otherRuns.filter((run) =>
    [Priority.ARCHIVED_CLOSED].includes(run.state.priority),
  );

  return (
    <>
      <h2 className="course-detail__title">
        {openedRuns.length === 1 ? (
          <FormattedMessage {...messages.otherCourseRuns} />
        ) : (
          <FormattedMessage {...messages.courseRunsTitle} />
        )}
      </h2>
      {openedRuns.length <= 1 && otherRuns.length === 0 && (
        <div className="course-detail__row course-detail__no-runs">
          {openedRuns.length === 0 ? (
            <p>
              <FormattedMessage {...messages.noCourseRuns} />
            </p>
          ) : (
            <p>
              <FormattedMessage {...messages.noOtherCourseRuns} />
            </p>
          )}
        </div>
      )}
      {openedRuns.length > 1 && (
        <div
          id="courseDetailsRunsOpen"
          className="course-detail__row course-detail__runs course-detail__runs--open"
        >
          {openedRuns.map((run) => (
            <SyllabusCourseRun key={run.id} courseRun={run} course={course} />
          ))}
        </div>
      )}
      {toBeScheduledRuns.length > 0 && (
        <div className="course-detail__row course-detail__runs course-detail__runs--to_be_scheduled">
          <h3 className="course-detail__title">
            <FormattedMessage {...messages.toBeScheduled} />
          </h3>
          <SyllabusSimpleCourseRunsList courseRuns={toBeScheduledRuns} />
        </div>
      )}
      {upcomingRuns.length > 0 && (
        <div className="course-detail__row course-detail__runs course-detail__runs--upcoming">
          <h3 className="course-detail__title">
            <FormattedMessage {...messages.upcoming} />
          </h3>
          <SyllabusSimpleCourseRunsList courseRuns={upcomingRuns} />
        </div>
      )}
      {ongoingRuns.length > 0 && (
        <div className="course-detail__row course-detail__runs course-detail__runs--ongoing">
          <h3 className="course-detail__title">
            <FormattedMessage {...messages.ongoing} />
          </h3>
          <SyllabusSimpleCourseRunsList courseRuns={ongoingRuns} checkEnrollment />
        </div>
      )}
      {archivedRuns.length > 0 && (
        <div className="course-detail__row course-detail__runs course-detail__runs--archived">
          <h3 className="course-detail__title">
            <FormattedMessage {...messages.archived} />
          </h3>
          <SyllabusSimpleCourseRunsList
            courseRuns={archivedRuns}
            maxCourseRuns={maxArchivedCourseRuns}
          />
        </div>
      )}
    </>
  );
};
