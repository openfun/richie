import { Select, SelectHandle } from '@openfun/cunningham-react';
import { useMemo, useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { MenuLink } from 'widgets/Dashboard/components/DashboardSidebar';

const messages = defineMessages({
  settingsLinkLabel: {
    id: 'components.NavigationSelect.settingsLinkLabel',
    description: 'label of the settings link',
    defaultMessage: 'Settings',
  },
  responsiveNavLabel: {
    id: 'components.NavigationSelect.responsiveNavLabel',
    description: 'a11y related label for select input used to navigate on responsive',
    defaultMessage: 'Navigate to',
  },
});

type CunninghamSelectOnChange = (event: {
  target: { value: string | number | undefined | string[] };
}) => void;

interface NavigationSelectProps {
  menuLinks: MenuLink[];
}

const NavigationSelect = ({ menuLinks }: NavigationSelectProps) => {
  const navigate = useNavigate();
  const intl = useIntl();
  const location = useLocation();
  const selectNav = useRef<SelectHandle>(null);
  const selectedLink = useMemo(
    () => menuLinks.find((link) => matchPath({ path: link.to, end: true }, location.pathname))?.to,
    [location, menuLinks],
  );

  const onSelectChange: CunninghamSelectOnChange = (event) => {
    navigate(event.target.value as string);
    selectNav.current?.blur();
  };

  return (
    <Select
      label={intl.formatMessage(messages.responsiveNavLabel)}
      ref={selectNav}
      hideLabel={true}
      clearable={false}
      name="dashboard-responsive-nav"
      value={selectedLink}
      onChange={onSelectChange}
      className="dashboard-sidebar__nav-select"
      options={menuLinks.map((link) => ({ label: link.label, value: link.to }))}
    />
  );
};

export default NavigationSelect;
