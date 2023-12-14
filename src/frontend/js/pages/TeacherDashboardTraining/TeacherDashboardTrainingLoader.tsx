import { FormattedMessage, defineMessages } from 'react-intl';
import { useParams } from 'react-router-dom';

import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardCourseSidebar } from 'widgets/Dashboard/components/TeacherDashboardCourseSidebar';
import { Spinner } from 'components/Spinner';
import { useCourseProductRelation } from 'hooks/useCourseProductRelation';
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
  const { courseProductRelationId, organizationId } = useParams<{
    courseProductRelationId: string;
    organizationId?: string;
  }>();

  const {
    item: courseProductRelation,
    states: { fetching },
  } = useCourseProductRelation(courseProductRelationId, { organization_id: organizationId });
  useBreadcrumbsPlaceholders({
    courseTitle: courseProductRelation?.product.title ?? '',
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
        <TeacherDashboardTraining courseProductRelation={courseProductRelation} />
      )}
    </DashboardLayout>
  );
};
