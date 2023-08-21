import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { Button } from '@openfun/cunningham-react';
import { CourseGlimpseList, getCourseGlimpseListProps } from 'components/CourseGlimpseList';
import { Spinner } from 'components/Spinner';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import context from 'utils/context';
import { useCourseProductUnion } from 'hooks/useCourseProductUnion';
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading courses...',
    description: "Message displayed while loading trainings on the teacher's dashboard'",
    id: 'components.TeacherDashboardCourseList.loading',
  },
  emptyList: {
    description: "Empty placeholder of the dashboard's list of trainings",
    defaultMessage: 'You have no courses yet.',
    id: 'components.TeacherDashboardCourseList.emptyList',
  },
  loadMore: {
    defaultMessage: 'Load more',
    description: 'Button to manually load more trainings',
    id: 'components.TeacherDashboardCourseList.loadMore',
  },
});

interface TeacherDashboardCourseListProps {
  titleTranslated: string;
  organizationId?: string;
}

const TeacherDashboardCourseList = ({
  titleTranslated,
  organizationId,
}: TeacherDashboardCourseListProps) => {
  const loadMoreButtonRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const intl = useIntl();
  const routerLocal = intl.locale.split('-')[0];
  const {
    data: courseAndProductList,
    isLoading,
    next,
    hasMore,
  } = useCourseProductUnion({ perPage: 25, organizationId });
  useIntersectionObserver({
    target: loadMoreButtonRef,
    onIntersect: next,
    enabled: hasMore,
  });

  return (
    <div className="dashboard-course-list">
      {titleTranslated && (
        <Link to={getDashboardRoutePath(intl)(TeacherDashboardPaths.TEACHER_COURSES)}>
          <h2 className="dashboard-course-list__title">{titleTranslated}</h2>
        </Link>
      )}
      {isLoading && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      {!isLoading &&
        (courseAndProductList.length > 0 ? (
          <>
            <CourseGlimpseList
              courses={getCourseGlimpseListProps(courseAndProductList, routerLocal, organizationId)}
              context={context}
              className="dashboard__course-glimpse-list"
            />
            {hasMore && (
              <Button
                onClick={() => next()}
                disabled={isLoading}
                ref={loadMoreButtonRef}
                color="tertiary"
              >
                <FormattedMessage {...messages.loadMore} />
              </Button>
            )}
          </>
        ) : (
          <FormattedMessage {...messages.emptyList} />
        ))}
    </div>
  );
};

export default TeacherDashboardCourseList;
