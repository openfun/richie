import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherProfileDashboardSidebar } from 'widgets/Dashboard/components/TeacherProfileDashboardSidebar';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading settings...',
    description: 'Message displayed while loading settings',
    id: 'components.TeacherProfileSettingsDashboardLoader.loading',
  },
});

export const TeacherProfileSettingsDashboardLoader = () => {
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
