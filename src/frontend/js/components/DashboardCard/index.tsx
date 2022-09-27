import { Button } from 'components/Button';
import { Icon } from 'components/Icon';
import { FC, ReactNode, useMemo, useRef, useState } from 'react';

interface DashboardCardProps {
  header: ReactNode | string;
  footer?: ReactNode;
}

export const DashboardCard: FC<DashboardCardProps> = (props) => {
  const [opened, setOpened] = useState(true);
  const expandableRef = useRef<HTMLDivElement>(null);
  const [wrapperHeight, setWrapperHeight] = useState('auto');

  const toggle = () => {
    if (opened) {
      setOpened(false);
      // We need to set hard height first in order to trigger the transition.
      setWrapperHeight(expandableRef.current!.getBoundingClientRect().height + 'px');
      setTimeout(() => {
        setWrapperHeight('0');
      });
    } else {
      setOpened(true);
      setWrapperHeight(expandableRef.current!.getBoundingClientRect().height + 'px');
      expandableRef.current!.parentNode!.addEventListener(
        'transitionend',
        () => {
          // After the animation is completed, set height to auto to prevent hidden overflow
          // if the content changes afterwards.
          setWrapperHeight('auto');
        },
        { once: true },
      );
    }
  };

  const classes = useMemo(() => {
    const c = ['dashboard-card'];
    if (opened) {
      c.push('dashboard-card--opened');
    } else {
      c.push('dashboard-card--closed');
    }
    return c;
  }, [opened]);

  return (
    <div className={classes.join(' ')}>
      <header className="dashboard-card__header">
        <div>{props.header}</div>
        <Button onClick={toggle} size="nano">
          <Icon name="icon-chevron-down-outline" data-testid="dashboard-card__header__toggle" />
        </Button>
      </header>
      <div
        className="dashboard-card__wrapper"
        style={{ height: wrapperHeight }}
        data-testid="dashboard-card__wrapper"
      >
        <div className="dashboard-card__expandable" ref={expandableRef}>
          <div className="dashboard-card__content">{props.children}</div>
          {!!props.footer && <footer className="dashboard-card__footer">{props.footer}</footer>}
        </div>
      </div>
    </div>
  );
};
