import { FormattedMessage, defineMessages } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import TeacherDashboardCourseList from 'components/TeacherDashboardCourseList';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardProfileSidebar } from 'widgets/Dashboard/components/TeacherDashboardProfileSidebar';
import SearchBar from 'widgets/Dashboard/components/SearchBar';
import SearchResultsCount from 'widgets/Dashboard/components/SearchResultsCount';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || undefined;
  const onSubmit = (newQuery: string) => {
    searchParams.set('query', newQuery);
    setSearchParams(searchParams);
  };

  return (
    <DashboardLayout sidebar={<TeacherDashboardProfileSidebar />}>
      <div className="dashboard__page_head">
        <div className="dashboard__page_title_container">
          <h1 className="dashboard__page_title">
            <FormattedMessage {...messages.courses} />
          </h1>
        </div>

        <SearchBar query={query} onSubmit={onSubmit} />
        <SearchResultsCount />
      </div>
      <div className="teacher-courses-page">
        <TeacherDashboardCourseList />
      </div>
    </DashboardLayout>
  );
};
