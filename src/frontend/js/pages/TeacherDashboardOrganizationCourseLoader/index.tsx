import { defineMessages, FormattedMessage } from 'react-intl';
import { useParams, useSearchParams } from 'react-router-dom';
import { Suspense } from 'react';
import { Spinner } from 'components/Spinner';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';
import { useOrganization } from 'hooks/useOrganizations';
import TeacherDashboardCourseList from 'components/TeacherDashboardCourseList';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import SearchResultsCount from 'widgets/Dashboard/components/SearchResultsCount';
import SearchBar from 'widgets/Dashboard/components/SearchBar';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { organizationId } = useParams<{ organizationId: string }>();
  const {
    item: organization,
    states: { fetching },
  } = useOrganization(organizationId);
  useBreadcrumbsPlaceholders({
    organizationTitle: organization?.title ?? '',
  });

  const query = searchParams.get('query') || undefined;
  const onSubmit = (newQuery: string) => {
    searchParams.set('query', newQuery);
    setSearchParams(searchParams);
  };

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

            <SearchBar query={query} onSubmit={onSubmit} />
            <SearchResultsCount />
          </div>

          <Suspense fallback={<div />}>
            <TeacherDashboardCourseList organizationId={organization.id} />
          </Suspense>
        </>
      )}
    </DashboardLayout>
  );
};
