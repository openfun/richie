import { matchPath, NavLink, resolvePath, useLocation } from 'react-router-dom';
import { PropsWithChildren, ReactNode, useCallback } from 'react';
import classNames from 'classnames';
import { useSession } from 'contexts/SessionContext';
import { DashboardAvatar } from 'widgets/Dashboard/components/DashboardAvatar';
import NavigationSelect from './components/NavigationSelect';

export interface MenuLink {
  to: string;
  label: string;
  badge?: ReactNode;
}

export interface DashboardSidebarProps extends PropsWithChildren {
  menuLinks: MenuLink[];
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
  const isActive = useCallback(
    (to: string) => {
      const path = resolvePath(to).pathname;
      return !!matchPath({ path, end: true }, location.pathname);
    },
    [location],
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
              className={classNames('dashboard-sidebar__container__nav__item', {
                active: isActive(link.to),
              })}
            >
              <NavLink to={link.to} end>
                {link.label}
              </NavLink>
              {link.badge}
            </li>
          ))}
        </ul>
      </div>
      {children}
    </aside>
  );
};
