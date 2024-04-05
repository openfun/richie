import React, { useEffect, useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { createPortal } from 'react-dom';
import { Button, CunninghamProvider } from '@openfun/cunningham-react';
import { CourseRun, Priority } from 'types';
import { computeStates } from 'utils/CourseRuns';
import { SyllabusAsideList } from 'widgets/SyllabusCourseRunsList/components/SyllabusAsideList';
import { SyllabusCourseRun } from 'widgets/SyllabusCourseRunsList/components/SyllabusCourseRun';
import { DjangoCMSPluginsInit } from 'components/DjangoCMSTemplate';
import { isJoanieEnabled } from 'api/joanie';
import context from 'utils/context';
import { CourseLight } from 'types/Joanie';
import CourseWishButton from './components/CourseWishButton';

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
  course: CourseLight;
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
    <CunninghamProvider modalParentSelector={() => document.body}>
      {openedRuns.length === 0 && (
        <div className="course-detail__row course-detail__runs course-detail__runs--open">
          <div className="course-detail__empty">
            <FormattedMessage {...messages.noOpenedCourseRuns} />
            {isJoanieEnabled && Boolean(context?.features.WISHLIST) && (
              <CourseWishButton course={course} />
            )}
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
          <Button href={'#' + OPENED_COURSES_ELEMENT_ID} onClick={choose} fullWidth={true}>
            <FormattedMessage {...messages.multipleOpenedCourseRunsButton} />
          </Button>
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
    </CunninghamProvider>
  );
};

export default SyllabusCourseRunsList;
