import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherOrganizationDashboardSidebar } from 'widgets/Dashboard/components/TeacherOrganizationDashboardSidebar';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading organization ...',
    description: "Message displayed while loading courses on the teacher's dashboard'",
    id: 'components.TeacherOrganizationCourseDashboardLoader.loading',
  },
});

export const TeacherOrganizationCourseDashboardLoader = () => {
  // FIXME: fetch data
  const fetching = false;
  return (
    <DashboardLayout sidebar={<TeacherOrganizationDashboardSidebar />}>
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
