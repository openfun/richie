import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherProfileDashboardSidebar } from 'widgets/Dashboard/components/TeacherProfileDashboardSidebar';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading profile ...',
    description: 'Message displayed while loading profile',
    id: 'components.TeacherProfileDashboardLoader.loading',
  },
});

export const TeacherProfileDashboardLoader = () => {
  // FIXME: fetch data
  const fetching = false;
  return (
    <DashboardLayout sidebar={<TeacherProfileDashboardSidebar />}>
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
