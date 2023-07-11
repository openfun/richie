import React, { useEffect, useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { createPortal } from 'react-dom';
import { CourseRun, Priority } from 'types';
import { Course } from 'types/Course';
import { computeStates } from 'utils/CourseRuns';
import { SyllabusAsideList } from 'widgets/SyllabusCourseRunsList/SyllabusAsideList';
import { SyllabusCourseRun } from 'widgets/SyllabusCourseRunsList/SyllabusCourseRun';
import { DjangoCMSPluginsInit } from 'components/DjangoCMSTemplate';

const OPENED_COURSES_ELEMENT_ID = 'courseDetailsRunsOpen';

const messages = defineMessages({
  noOpenedCourseRuns: {
    id: 'components.SyllabusCourseRunsList.noOpenedCourseRuns',
    description: 'Message displayed when there are no opened course runs on a syllabus',
    defaultMessage: 'No opened course runs',
  },
  multipleOpenedCourseRuns: {
    id: 'components.SyllabusCourseRunsList.multipleOpenedCourseRuns',
    description: 'Message displayed when there are multiple opened course runs on a syllabus',
    defaultMessage: '{count} course runs are currently open for this course',
  },
  multipleOpenedCourseRunsButton: {
    id: 'components.SyllabusCourseRunsList.multipleOpenedCourseRunsButton',
    description:
      'Message displayed on the button when there are multiple opened course runs on a syllabus',
    defaultMessage: 'Choose now',
  },
});

export const COURSE_DETAIL_ASIDE_CLASS = 'course-detail__aside';

const SyllabusCourseRunsList = ({
  courseRuns,
  course,
  maxArchivedCourseRuns,
}: {
  courseRuns: CourseRun[];
  course: Course;
  maxArchivedCourseRuns: number;
}) => {
  useEffect(() => {
    DjangoCMSPluginsInit();
  }, []);

  const courseRunsComputed = useMemo(() => {
    return computeStates(courseRuns).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }, [courseRuns]);

  const openedRuns = useMemo(() => {
    return courseRunsComputed.filter((run) =>
      [Priority.ONGOING_OPEN, Priority.FUTURE_OPEN, Priority.ARCHIVED_OPEN].includes(
        run.state.priority,
      ),
    );
  }, [courseRunsComputed]);

  const choose = (e: React.MouseEvent) => {
    e.preventDefault();
    document
      .getElementById(OPENED_COURSES_ELEMENT_ID)!
      .scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const subContainer = useMemo(() => document.querySelector('.' + COURSE_DETAIL_ASIDE_CLASS)!, []);

  return (
    <>
      {openedRuns.length === 0 && (
        <div className="course-detail__row course-detail__runs course-detail__runs--open">
          <div className="course-detail__empty">
            <FormattedMessage {...messages.noOpenedCourseRuns} />
          </div>
        </div>
      )}
      {openedRuns.length === 1 && (
        <div className="course-detail__row course-detail__runs course-detail__runs--open">
          <SyllabusCourseRun courseRun={openedRuns[0]} course={course} />
        </div>
      )}
      {openedRuns.length > 1 && (
        <div className="course-detail__row course-detail__runs course-detail__go-to-open-runs">
          <p>
            <FormattedMessage
              {...messages.multipleOpenedCourseRuns}
              values={{ count: openedRuns.length }}
            />
          </p>
          <a
            className="button button--primary"
            href={'#' + OPENED_COURSES_ELEMENT_ID}
            onClick={choose}
          >
            <FormattedMessage {...messages.multipleOpenedCourseRunsButton} />
          </a>
        </div>
      )}
      {createPortal(
        <SyllabusAsideList
          courseRuns={courseRunsComputed}
          course={course}
          maxArchivedCourseRuns={maxArchivedCourseRuns}
        />,
        subContainer,
      )}
    </>
  );
};

export default SyllabusCourseRunsList;
