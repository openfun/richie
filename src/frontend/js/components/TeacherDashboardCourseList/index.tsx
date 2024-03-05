import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useRef } from 'react';
import { Button } from '@openfun/cunningham-react';
import classNames from 'classnames';
import { CourseGlimpseList, getCourseGlimpseListProps } from 'components/CourseGlimpseList';
import { Spinner } from 'components/Spinner';
import context from 'utils/context';
import { useIntersectionObserver } from 'hooks/useIntersectionObserver';
import { CourseListItem, CourseProductRelation } from 'types/Joanie';

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
  titleTranslated?: string;
  organizationId?: string;
  loadMore: () => void;
  courseAndProductList?: (CourseListItem | CourseProductRelation)[];
  isLoadingMore?: boolean;
  hasMore?: boolean;
  isLoading?: boolean;
}

const TeacherDashboardCourseList = ({
  titleTranslated,
  organizationId,
  loadMore,
  courseAndProductList = [],
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
}: TeacherDashboardCourseListProps) => {
  const loadMoreButtonRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const intl = useIntl();
  useIntersectionObserver({
    target: loadMoreButtonRef,
    onIntersect: loadMore,
    enabled: hasMore,
  });

  return (
    <div
      className={classNames('dashboard-course-list', { 'dashboard-course-list--fade': isLoading })}
    >
      {titleTranslated && (
        <h2 className="dashboard-course-list__title dashboard__page_title">{titleTranslated}</h2>
      )}
      {courseAndProductList.length > 0 ? (
        <CourseGlimpseList
          courses={getCourseGlimpseListProps(courseAndProductList, intl, organizationId)}
          context={context}
          className="dashboard__course-glimpse-list"
        />
      ) : (
        <FormattedMessage {...messages.emptyList} />
      )}

      {isLoadingMore && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}

      {hasMore && (
        <Button
          onClick={() => loadMore()}
          disabled={isLoadingMore}
          ref={loadMoreButtonRef}
          color="tertiary"
        >
          <FormattedMessage {...messages.loadMore} />
        </Button>
      )}
    </div>
  );
};

export default TeacherDashboardCourseList;
