import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Button } from 'components/Button';
import { Icon } from 'components/Icon';

interface Props {
  opened: boolean;
  close: Function;
  open: Function;
  isMobile: boolean;
}

export const DashboardSidebar = ({ opened, open, close, isMobile }: Props) => {
  const classes = ['dashboard__sidebar'];
  if (isMobile) {
    classes.push('dashboard__sidebar--mobile');
  }
  if (!opened) {
    classes.push('dashboard__sidebar--closed');
  }

  return (
    <aside className={classes.join(' ')}>
      {isMobile && (
        <div className="close">
          <Button size="nano" onClick={() => close()}>
            <Icon name="icon-round-close" className="button__icon" />
          </Button>
        </div>
      )}
      <img src="/static/richie/images/logo.png" className="dashboard__sidebar__logo" />
    </aside>
  );
};

/**
 * Hook to use the `DashboardSidebar` component.
 * Keep in mind that the `opened` status is only took into account on small screens, it is always
 * opened on large screens.
 */
export function useDashboardSidebar() {
  const [opened, setOpened] = useState(true);

  // TODO: Use constants.
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  console.log('isMobile', isMobile);

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
