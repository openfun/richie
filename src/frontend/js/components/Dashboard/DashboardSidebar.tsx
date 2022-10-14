import { useState } from 'react';
import { Link } from 'react-router-dom';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from 'components/Button';
import { Icon } from 'components/Icon';
import {
  DashboardPaths,
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'utils/routers/dashboard';
import { useMediaQuerySM } from 'hooks/useMedia';

const messages = defineMessages({
  header: {
    id: 'components.DashboardSidebar.header',
    description: 'Title of the dashboard sidebar',
    defaultMessage: 'Dashboard',
  },
});

interface Props {
  opened: boolean;
  close: Function;
  open: Function;
  isMobile: boolean;
}

export const DashboardSidebar = ({ opened, close, isMobile }: Props) => {
  const classes = ['dashboard__sidebar'];
  if (isMobile) {
    classes.push('dashboard__sidebar--mobile');
  }
  if (!opened) {
    classes.push('dashboard__sidebar--closed');
  }

  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);

  return (
    <aside className={classes.join(' ')}>
      <div className="dashboard__sidebar__container">
        {isMobile && (
          <div className="close">
            <Button size="nano" onClick={() => close()}>
              <Icon name="icon-round-close" className="button__icon" />
            </Button>
          </div>
        )}
        <div className="dashboard__sidebar__logo">
          <img src="/static/richie/images/logo.png" alt="" />
        </div>
        <h3>
          <FormattedMessage {...messages.header} />
        </h3>
        <ul>
          <li>
            <Link to={getRoutePath(DashboardPaths.COURSES)}>
              {getRouteLabel(DashboardPaths.COURSES)}
            </Link>
          </li>
          <li>
            <Link to={getRoutePath(DashboardPaths.PREFERENCES)}>
              {getRouteLabel(DashboardPaths.PREFERENCES)}
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
};

/**
 * Hook to use the `DashboardSidebar` component.
 * Keep in mind that the `opened` status is only took into account on small screens, it is always
 * opened on large screens.
 */
export function useDashboardSidebar() {
  const [opened, setOpened] = useState(false);
  const isMobile = useMediaQuerySM();
  return {
    opened,
    isMobile,
    open: () => {
      setOpened(true);
    },
    close: () => {
      setOpened(false);
    },
    toggle: () => {
      setOpened(!opened);
    },
  };
}
