import { defineMessages, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Icon } from 'components/Icon';

const messages = defineMessages({
  settingsLinkLabel: {
    id: 'components.DashboardSidebar.settingsLinkLabel',
    description: 'label of the settings link',
    defaultMessage: 'Settings',
  },
});

interface SettingsLinkProps {
  to: string;
}

const SettingsLink = ({ to }: SettingsLinkProps) => {
  return (
    <Link to={to} className="settings-link">
      <Icon name="icon-cog" className="settings-link-icon" />
      <FormattedMessage {...messages.settingsLinkLabel} />
    </Link>
  );
};

export default SettingsLink;
