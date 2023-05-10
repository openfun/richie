import { defineMessages, FormattedMessage } from 'react-intl';
import { matchPath, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChangeEvent, PropsWithChildren, useMemo, useRef } from 'react';
import { useSession } from 'contexts/SessionContext';
import { DashboardAvatar } from 'widgets/Dashboard/components/DashboardAvatar';

const messages = defineMessages({
  settingsLinkLabel: {
    id: 'components.DashboardSidebar.settingsLinkLabel',
    description: 'label of the settings link',
    defaultMessage: 'Settings',
  },
  responsiveNavLabel: {
    id: 'components.DashboardSidebar.responsiveNavLabel',
    description: 'a11y related label for select input used to navigate on responsive',
    defaultMessage: 'Navigate to',
  },
});

export interface DashboardSidebarProps extends PropsWithChildren {
  menuLinks: Record<string, string>[];
  header: string;
  subHeader: string;
  title?: string;
}

export const DashboardSidebar = ({
  children,
  menuLinks,
  header,
  subHeader,
  title,
}: DashboardSidebarProps) => {
  const { user } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const selectNav = useRef<HTMLSelectElement>(null);
  const classes = ['dashboard-sidebar'];

  const selectedLink = useMemo(
    () => menuLinks.find((link) => matchPath({ path: link.to, end: true }, location.pathname))?.to,
    [location, menuLinks],
  );

  const onSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    navigate(event.target.value);
    selectNav.current?.blur();
  };

  return (
    <aside className={classes.join(' ')} data-testid="dashboard__sidebar">
      <div className="dashboard-sidebar__container">
        <header className="dashboard-sidebar__container__header">
          <div className="dashboard-sidebar__container__header__avatar">
            <DashboardAvatar user={user!} />
          </div>
          <h3>{header}</h3>
          <p>{subHeader}</p>
        </header>
        {title && <h4 className="dashboard-sidebar__container__title">{title}</h4>}
        <div className="dashboard-sidebar__container__responsive-nav">
          <label htmlFor="dashboard-responsive-nav" className="offscreen">
            <FormattedMessage {...messages.responsiveNavLabel} />
          </label>
          <select
            ref={selectNav}
            id="dashboard-responsive-nav"
            value={selectedLink}
            onChange={onSelectChange}
            className="form-field__select-input"
          >
            {menuLinks.map((link) => (
              <option key={link.to} value={link.to}>
                {link.label}
              </option>
            ))}
          </select>
        </div>

        <ul>
          {menuLinks.map((link) => (
            <li
              key={link.to}
              className={selectedLink && selectedLink === link.to ? 'active' : undefined}
            >
              <NavLink to={link.to} end>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      {children}
    </aside>
  );
};
