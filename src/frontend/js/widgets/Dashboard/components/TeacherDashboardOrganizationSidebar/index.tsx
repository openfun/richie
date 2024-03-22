import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useParams } from 'react-router-dom';
import { Spinner } from 'components/Spinner';
import { useOrganization } from 'hooks/useOrganizations';
import { DashboardSidebar, MenuLink } from 'widgets/Dashboard/components/DashboardSidebar';
import { getDashboardRouteLabel } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherDashboardPaths';
import { DashboardAvatar, DashboardAvatarVariantEnum } from '../DashboardAvatar';
import ContractNavLink from '../DashboardSidebar/components/ContractNavLink';

const messages = defineMessages({
  subHeader: {
    id: 'components.TeacherDashboardOrganizationSidebar.subHeader',
    description: 'Sub title of the organization dashboard sidebar',
    defaultMessage: 'You are on the organization dashboard',
  },
  loading: {
    defaultMessage: 'Loading organization...',
    description: 'Message displayed while loading an organization',
    id: 'components.TeacherDashboardOrganizationSidebar.loading',
  },
});

export const TeacherDashboardOrganizationSidebar = () => {
  const intl = useIntl();
  const getRouteLabel = getDashboardRouteLabel(intl);
  const { organizationId, courseProductRelationId } = useParams<{
    organizationId: string;
    courseProductRelationId?: string;
  }>();
  const {
    item: organization,
    states: { fetching },
  } = useOrganization(organizationId);

  const getMenuLinkFromPath = (basePath: TeacherDashboardPaths) => {
    const path = generatePath(basePath, { organizationId } as any);

    const menuLink: MenuLink = {
      to: path,
      label: getRouteLabel(basePath),
    };

    if (basePath === TeacherDashboardPaths.ORGANIZATION_CONTRACTS) {
      menuLink.component = (
        <ContractNavLink
          link={menuLink}
          organizationId={organizationId}
          courseProductRelationId={courseProductRelationId}
        />
      );
    }

    return menuLink;
  };

  const links = [
    TeacherDashboardPaths.ORGANIZATION_COURSES,
    TeacherDashboardPaths.ORGANIZATION_CONTRACTS,
  ].map(getMenuLinkFromPath);

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
      avatar={
        <DashboardAvatar
          title={organization.title}
          variant={DashboardAvatarVariantEnum.SQUARE}
          image={organization.logo}
        />
      }
    />
  );
};
