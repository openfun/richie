import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { OrganizationMock } from 'api/mocks/joanie/organizations';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';

export const messages = defineMessages({
  organizationsTitle: {
    id: 'components.TeacherProfileDashboardSidebar.OrganizationLinks.organizationsTitle',
    description: 'Title of the organizations section',
    defaultMessage: 'My universities',
  },
  organizationLinkTitle: {
    id: 'components.TeacherProfileDashboardSidebar.OrganizationLinks.organizationLinkTitle',
    description: 'Organization link title',
    defaultMessage: 'Link to organization "{organizationTitle}"',
  },
});

interface OrganizationLinksProps {
  organizations: OrganizationMock[];
}

const OrganizationLinks = ({ organizations }: OrganizationLinksProps) => {
  const intl = useIntl();
  return (
    <div className="dashboard-sidebar__organization-section" data-testid="organization-links">
      <span className="dashboard-sidebar__organization-section__title">
        <FormattedMessage {...messages.organizationsTitle} />
      </span>
      <div className="dashboard-sidebar__organization-section__link_list">
        {organizations.map((organization) => (
          <Link
            key={organization.id}
            to={getDashboardRoutePath(intl)(TeacherDashboardPaths.ORGANIZATION_COURSES, {
              organizationId: organization.id,
            })}
            className="dashboard-sidebar__organization-section__link"
            title={intl.formatMessage(messages.organizationLinkTitle, {
              organizationTitle: organization.title,
            })}
          >
            <img
              className="dashboard-sidebar__organization-section__link__img"
              alt={organization.title}
              src={organization.logo.url}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OrganizationLinks;
