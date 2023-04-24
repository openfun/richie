import { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { CourseGlimpseList, getCourseGlimpsListProps } from 'components/CourseGlimpseList';
import { Spinner } from 'components/Spinner';
import { useCourses, TeacherCourseSearchFilters } from 'hooks/useCourses';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import context from 'utils/context';
import useIsLoading from 'hooks/useIsLoading';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading courses...',
    description: "Message displayed while loading courses on the teacher's dashboard'",
    id: 'components.DashboardCourseList.loading',
  },
});

interface DashboardCourseListProps {
  titleTranslated: string;
  filters: TeacherCourseSearchFilters;
}

const DashboardCourseList = ({ titleTranslated, filters }: DashboardCourseListProps) => {
  const intl = useIntl();
  const coursesResults = useCourses(filters);

  const {
    items: courses,
    states: { fetching },
  } = coursesResults;

  const isLoading = useIsLoading([fetching], 300);

  const fadeInNodeRef = useRef(null);

  return (
    <div className="dashboard-course-list">
      {titleTranslated && (
        <Link
          to={`${getDashboardRoutePath(intl)(
            TeacherDashboardPaths.TEACHER_COURSES,
          )}?${queryString.stringify(filters)}`}
        >
          <h2 className="dashboard-course-list__title">{titleTranslated}</h2>
        </Link>
      )}
      {isLoading && (
        <div className="dashboard-course-list__placeholder">
          <Spinner aria-labelledby="loading-courses-data">
            <span id="loading-courses-data">
              <FormattedMessage {...messages.loading} />
            </span>
          </Spinner>
        </div>
      )}

      <CSSTransition
        in={!isLoading && !!courses.length}
        nodeRef={fadeInNodeRef}
        timeout={300}
        classNames="fade-in"
        unmountOnExit
      >
        <div ref={fadeInNodeRef}>
          <CourseGlimpseList
            courses={getCourseGlimpsListProps(courses)}
            context={context}
            className="dashboard__course-glimpse-list"
          />
        </div>
      </CSSTransition>
    </div>
  );
};

export default DashboardCourseList;
