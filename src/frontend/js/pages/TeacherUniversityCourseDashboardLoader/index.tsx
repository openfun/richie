import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherUniversityDashboardSidebar } from 'widgets/Dashboard/components/TeacherUniversityDashboardSidebar';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading order ...',
    description: 'Message displayed while loading an order',
    id: 'components.TeacherDashboardProfileLoader.loading',
  },
});

export const TeacherUniversityCourseDashboardLoader = () => {
  // FIXME: fetch data
  const fetching = false;
  return (
    <DashboardLayout sidebar={<TeacherUniversityDashboardSidebar />}>
      {fetching && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
    </DashboardLayout>
  );
};
