import { FormattedMessage, defineMessages } from 'react-intl';
import { useParams } from 'react-router-dom';

import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherCourseDashboardSidebar } from 'widgets/Dashboard/components/TeacherCourseDashboardSidebar';
import { Spinner } from 'components/Spinner';
import { useCourseProductRelation } from 'hooks/useCourseProductRelation';
import { TeacherTrainingDashboard } from '.';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Training area',
    description: 'Use for the page title of the training area',
    id: 'components.TeacherTrainingDashboardLoader.pageTitle',
  },
  loading: {
    defaultMessage: 'Loading training...',
    description: 'Message displayed while loading a course',
    id: 'components.TeacherTrainingDashboardLoader.loading',
  },
});

export const TeacherTrainingDashboardLoader = () => {
  const { courseProductRelationId } = useParams<{
    courseProductRelationId: string;
  }>();

  const {
    item: courseProductRelation,
    states: { fetching },
  } = useCourseProductRelation(courseProductRelationId);

  return (
    <DashboardLayout sidebar={<TeacherCourseDashboardSidebar />}>
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
        <TeacherTrainingDashboard courseProductRelation={courseProductRelation} />
      )}
    </DashboardLayout>
  );
};
