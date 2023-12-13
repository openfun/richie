import { matchPath, NavLink, useLocation } from 'react-router-dom';
import { PropsWithChildren, ReactNode, useMemo } from 'react';
import { useSession } from 'contexts/SessionContext';
import { DashboardAvatar } from 'widgets/Dashboard/components/DashboardAvatar';
import NavigationSelect from './components/NavigationSelect';

export interface DashboardSidebarProps extends PropsWithChildren {
  menuLinks: Record<string, string>[];
  header: string;
  subHeader: string;
  title?: string;
  avatar?: ReactNode;
}

export const DashboardSidebar = ({
  children,
  menuLinks,
  header,
  subHeader,
  title,
  avatar,
}: DashboardSidebarProps) => {
  const { user } = useSession();
  const location = useLocation();
  const classes = ['dashboard-sidebar'];

  const selectedLink = useMemo(
    () => menuLinks.find((link) => matchPath({ path: link.to, end: true }, location.pathname))?.to,
    [location, menuLinks],
  );

  return (
    <aside className={classes.join(' ')} data-testid="dashboard__sidebar">
      <div className="dashboard-sidebar__container">
        <header className="dashboard-sidebar__container__header">
          <div className="dashboard-sidebar__container__header__avatar">
            {avatar || <DashboardAvatar title={user!.username} />}
          </div>
          <h3>{header}</h3>
          <p>{subHeader}</p>
        </header>
        {title && <h4 className="dashboard-sidebar__container__title">{title}</h4>}
        <div className="dashboard-sidebar__container__responsive-nav">
          <NavigationSelect menuLinks={menuLinks} />
        </div>

        <ul className="dashboard-sidebar__container__nav">
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
