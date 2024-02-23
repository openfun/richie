import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { Spinner } from 'components/Spinner';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';
import { useOrganization } from 'hooks/useOrganizations';
import TeacherDashboardCourseList from 'components/TeacherDashboardCourseList';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';

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
          <div className="dashboard__page_title_container">
            <h1 className="dashboard__page_title">
              <FormattedMessage
                {...messages.title}
                values={{ organizationTitle: organization.title }}
              />
            </h1>
          </div>
          <TeacherDashboardCourseList organizationId={organization.id} />
        </>
      )}
    </DashboardLayout>
  );
};
