import { Fragment, PropsWithChildren, ReactNode } from 'react';
import { useSession } from 'contexts/SessionContext';
import { DashboardAvatar } from 'widgets/Dashboard/components/DashboardAvatar';
import NavigationSelect from './components/NavigationSelect';
import MenuNavLink from './components/MenuNavLink';

export interface MenuLink {
  to: string;
  label: string;
  component?: ReactNode;
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
  const classes = ['dashboard-sidebar'];

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
          {menuLinks.map((link) =>
            link.component ? (
              <Fragment key={link.to}>{link.component}</Fragment>
            ) : (
              <MenuNavLink link={link} key={link.to} />
            ),
          )}
        </ul>
      </div>
      {children}
    </aside>
  );
};
