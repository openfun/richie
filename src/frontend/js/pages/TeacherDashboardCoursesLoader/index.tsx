import { FormattedMessage, defineMessages } from 'react-intl';
import TeacherDashboardCourseList from 'components/TeacherDashboardCourseList';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardProfileSidebar } from 'widgets/Dashboard/components/TeacherDashboardProfileSidebar';
import SearchBar from 'widgets/Dashboard/components/SearchBar';
import SearchResultsCount from 'widgets/Dashboard/components/SearchResultsCount';
import useTeacherCoursesSearch from 'hooks/useTeacherCoursesSearch';

const messages = defineMessages({
  courses: {
    defaultMessage: 'Your courses',
    description: 'Filtered courses title',
    id: 'components.TeacherDashboardCoursesLoader.title.filteredCourses',
  },
  incoming: {
    defaultMessage: 'Incoming',
    description: 'Incoming courses title',
    id: 'components.TeacherDashboardCoursesLoader.title.incoming',
  },
  ongoing: {
    defaultMessage: 'Ongoing',
    description: 'Ongoing courses title',
    id: 'components.TeacherDashboardCoursesLoader.title.ongoing',
  },
  archived: {
    defaultMessage: 'Archived',
    description: 'Archived courses title',
    id: 'components.TeacherDashboardCoursesLoader.title.archived',
  },
});

export const TeacherDashboardCoursesLoader = () => {
  const { data, isLoadingMore, isNewSearchLoading, next, hasMore, submitSearch, count } =
    useTeacherCoursesSearch();

  return (
    <DashboardLayout sidebar={<TeacherDashboardProfileSidebar />}>
      <div className="dashboard__page_head">
        <div className="dashboard__page_title_container">
          <h1 className="dashboard__page_title">
            <FormattedMessage {...messages.courses} />
          </h1>
        </div>

        <SearchBar.Container>
          <SearchBar onSubmit={submitSearch} />
          <SearchResultsCount nbResults={count} />
        </SearchBar.Container>
      </div>
      <div className="teacher-courses-page">
        <TeacherDashboardCourseList
          courseAndProductList={data}
          loadMore={next}
          isLoadingMore={isLoadingMore}
          isNewSearchLoading={isNewSearchLoading}
          hasMore={hasMore}
        />
      </div>
    </DashboardLayout>
  );
};
