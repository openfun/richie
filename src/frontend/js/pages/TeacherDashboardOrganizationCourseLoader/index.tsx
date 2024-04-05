import { defineMessages, FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import { Spinner } from 'components/Spinner';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';
import { useOrganization } from 'hooks/useOrganizations';
import TeacherDashboardCourseList from 'components/TeacherDashboardCourseList';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import SearchResultsCount from 'widgets/Dashboard/components/SearchResultsCount';
import SearchBar from 'widgets/Dashboard/components/SearchBar';
import useTeacherCoursesSearch from 'hooks/useTeacherCoursesSearch';

const messages = defineMessages({
  title: {
    defaultMessage: 'Courses of {organizationTitle}',
    description: 'Message displayed as title of organization courses page',
    id: 'components.TeacherDashboardOrganizationCourseLoader.title',
  },
  loading: {
    defaultMessage: 'Loading organization ...',
    description: 'Message displayed while loading an organization',
    id: 'components.TeacherDashboardOrganizationCourseLoader.loading',
  },
});

export const TeacherDashboardOrganizationCourseLoader = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { data, isLoadingMore, isNewSearchLoading, next, hasMore, submitSearch, count } =
    useTeacherCoursesSearch();

  const {
    item: organization,
    states: { fetching },
  } = useOrganization(organizationId);
  useBreadcrumbsPlaceholders({
    organizationTitle: organization?.title ?? '',
  });

  return (
    <DashboardLayout sidebar={<TeacherDashboardOrganizationSidebar />}>
      {fetching && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      {!fetching && (
        <>
          <div className="dashboard__page_head">
            <div className="dashboard__page_title_container">
              <h1 className="dashboard__page_title">
                <FormattedMessage
                  {...messages.title}
                  values={{ organizationTitle: organization.title }}
                />
              </h1>
            </div>

            <SearchBar onSubmit={submitSearch} />
            <SearchResultsCount nbResults={count} />
          </div>
          <TeacherDashboardCourseList
            organizationId={organization.id}
            courseAndProductList={data}
            loadMore={next}
            isLoadingMore={isLoadingMore}
            isNewSearchLoading={isNewSearchLoading}
            hasMore={hasMore}
          />
        </>
      )}
    </DashboardLayout>
  );
};
