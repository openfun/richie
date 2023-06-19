import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { generatePath, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import {
  DashboardAvatarPositionEnum,
  DashboardSidebar,
} from 'widgets/Dashboard/components/DashboardSidebar';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { useOrganization } from 'hooks/useOrganizations';
import { Spinner } from 'components/Spinner';
import { DashboardAvatar, DashboardAvatarVariantEnum } from '../DashboardAvatar';

const messages = defineMessages({
  subHeader: {
    id: 'components.TeacherOrganizationDashboardSidebar.subHeader',
    description: 'Sub title of the organization dashboard sidebar',
    defaultMessage: 'You are on the organization dashboard',
  },
  loading: {
    defaultMessage: 'Loading organization...',
    description: 'Message displayed while loading an organization',
    id: 'components.TeacherOrganizationDashboardSidebar.loading',
  },
});

export const TeacherOrganizationDashboardSidebar = () => {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const { organizationId } = useParams<{ organizationId: string }>();
  const {
    item: organization,
    states: { fetching },
  } = useOrganization(organizationId);

  const links = useMemo(
    () =>
      [
        TeacherDashboardPaths.ORGANIZATION_COURSES,
        TeacherDashboardPaths.ORGANIZATION_MEMBERS,
        TeacherDashboardPaths.ORGANIZATION_SETTINGS,
      ].map((path) => ({
        to: generatePath(
          getRoutePath(path, {
            organizationId: ':organizationId',
          }),
          { organizationId },
        ),
        label: getRouteLabel(path),
      })),
    [],
  );

  if (fetching) {
    return (
      <Spinner aria-labelledby="loading-courses-data">
        <span id="loading-courses-data">
          <FormattedMessage {...messages.loading} />
        </span>
      </Spinner>
    );
  }

  return (
    <DashboardSidebar
      menuLinks={links}
      header={organization.title}
      subHeader={intl.formatMessage(messages.subHeader)}
      avatarPosition={DashboardAvatarPositionEnum.THREE_QUARTER}
      avatar={
        <DashboardAvatar
          title={organization.title}
          variant={DashboardAvatarVariantEnum.SQUARE}
          imageUrl={organization.logo.src}
        />
      }
    />
  );
};
