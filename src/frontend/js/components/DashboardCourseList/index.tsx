import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { CourseGlimpseList, getCourseGlimpseListProps } from 'components/CourseGlimpseList';
import { Spinner } from 'components/Spinner';
import { useCourses, TeacherCourseSearchFilters } from 'hooks/useCourses';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import context from 'utils/context';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading courses...',
    description: "Message displayed while loading courses on the teacher's dashboard'",
    id: 'components.DashboardCourseList.loading',
  },
  emptyList: {
    description: "Empty placeholder of the dashboard's list of courses",
    defaultMessage: 'You have no courses yet.',
    id: 'components.DashboardCourseList.emptyList',
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
      {fetching && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      {!fetching &&
        (courses.length > 0 ? (
          <CourseGlimpseList
            courses={getCourseGlimpseListProps(courses)}
            context={context}
            className="dashboard__course-glimpse-list"
          />
        ) : (
          <FormattedMessage {...messages.emptyList} />
        ))}
    </div>
  );
};

export default DashboardCourseList;
