import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router-dom';
import { Organization } from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';

import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherDashboardPaths';

export const messages = defineMessages({
  organizationsTitle: {
    id: 'components.TeacherDashboardProfileSidebar.OrganizationLinks.organizationsTitle',
    description: 'Title of the organizations section',
    defaultMessage: 'My universities',
  },
  organizationLinkTitle: {
    id: 'components.TeacherDashboardProfileSidebar.OrganizationLinks.organizationLinkTitle',
    description: 'Organization link title',
    defaultMessage: 'Link to organization "{organizationTitle}"',
  },
});

interface OrganizationLinksProps {
  organizations: Organization[];
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
            to={generatePath(TeacherDashboardPaths.ORGANIZATION_COURSES, {
              organizationId: organization.id,
            })}
            className="dashboard-sidebar__organization-section__link"
            title={intl.formatMessage(messages.organizationLinkTitle, {
              organizationTitle: organization.title,
            })}
          >
            {organization.logo ? (
              <img
                className="dashboard-sidebar__organization-section__link__img"
                alt={organization.title}
                src={organization.logo.src}
                srcSet={organization.logo.srcset}
              />
            ) : (
              <span
                className="dashboard-sidebar__organization-section__link__abbr"
                aria-label={organization.title}
              >
                {StringHelper.abbreviate(organization.title, 3)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OrganizationLinks;
