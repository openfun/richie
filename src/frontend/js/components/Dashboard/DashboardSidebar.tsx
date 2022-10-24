import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { matchPath, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChangeEvent, useMemo, useRef } from 'react';
import {
  DashboardPaths,
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'utils/routers/dashboard';
import { useSession } from 'data/SessionProvider';
import { DashboardAvatar } from 'components/Dashboard/DashboardAvatar';

const messages = defineMessages({
  header: {
    id: 'components.DashboardSidebar.header',
    description: 'Title of the dashboard sidebar',
    defaultMessage: 'Welcome {name}',
  },
  subHeader: {
    id: 'components.DashboardSidebar.subHeader',
    description: 'Sub title of the dashboard sidebar',
    defaultMessage: 'You are on your dashboard',
  },
  responsiveNavLabel: {
    id: 'components.DashboardSidebar.responsiveNavLabel',
    description: 'a11y related label for select input used to navigate on responsive',
    defaultMessage: 'Navigate to',
  },
});

export const DashboardSidebar = () => {
  const { user } = useSession();
  const intl = useIntl();
  const location = useLocation();
  const navigate = useNavigate();
  const selectNav = useRef<HTMLSelectElement>(null);
  const classes = ['dashboard__sidebar'];

  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);

  const links = useMemo(
    () =>
      [DashboardPaths.COURSES, DashboardPaths.PREFERENCES].map((path) => ({
        to: getRoutePath(path),
        label: getRouteLabel(path),
      })),
    [],
  );

  const selectedLink = useMemo(
    () => links.find((link) => matchPath({ path: link.to, end: false }, location.pathname))?.to,
    [location],
  );

  const onSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    navigate(event.target.value);
    selectNav.current?.blur();
  };

  return (
    <aside className={classes.join(' ')} data-testid="dashboard__sidebar">
      <div className="dashboard__sidebar__container">
        <header className="dashboard__sidebar__container__header">
          <div className="dashboard__sidebar__container__header__avatar">
            <DashboardAvatar user={user!} />
          </div>
          <h3>
            <FormattedMessage {...messages.header} values={{ name: user?.username }} />
          </h3>
          <p>
            <FormattedMessage {...messages.subHeader} />
          </p>
        </header>
        <div className="dashboard__sidebar__container__responsive-nav">
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
            {links.map((link) => (
              <option key={link.to} value={link.to}>
                {link.label}
              </option>
            ))}
          </select>
        </div>

        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to}>{link.label}</NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};
