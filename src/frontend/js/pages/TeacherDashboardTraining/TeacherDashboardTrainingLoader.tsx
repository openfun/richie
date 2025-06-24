import { FormattedMessage, defineMessages } from 'react-intl';
import { useParams } from 'react-router';

import { useOffering } from 'hooks/useOffering';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardCourseSidebar } from 'widgets/Dashboard/components/TeacherDashboardCourseSidebar';
import { Spinner } from 'components/Spinner';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { TeacherDashboardTraining } from '.';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Training area',
    description: 'Use for the page title of the training area',
    id: 'components.TeacherDashboardTrainingLoader.pageTitle',
  },
  loading: {
    defaultMessage: 'Loading training...',
    description: 'Message displayed while loading a course',
    id: 'components.TeacherDashboardTrainingLoader.loading',
  },
});

export const TeacherDashboardTrainingLoader = () => {
  const { offeringId, organizationId } = useParams<{
    offeringId: string;
    organizationId?: string;
  }>();

  const {
    item: offering,
    states: { fetching },
  } = useOffering(offeringId, { organization_id: organizationId });
  useBreadcrumbsPlaceholders({
    courseTitle: offering?.product.title ?? '',
  });
  return (
    <DashboardLayout sidebar={<TeacherDashboardCourseSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      {fetching ? (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      ) : (
        <TeacherDashboardTraining offering={offering} />
      )}
    </DashboardLayout>
  );
};
