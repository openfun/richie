import { PropsWithChildren, ReactNode, useMemo, useRef, useState } from 'react';
import c from 'classnames';
import { Button } from '@openfun/cunningham-react';
import { Icon, IconTypeEnum } from 'components/Icon';

interface Props {
  header: ReactNode | string;
  footer?: ReactNode;
  expandable?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const DashboardCard = ({
  children,
  header,
  footer,
  className,
  expandable = true,
  fullWidth = false,
}: PropsWithChildren<Props>) => {
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

  const classes = useMemo(
    () =>
      c('dashboard-card', {
        'dashboard-card--opened': opened,
        'dashboard-card--closed': !opened,
        'dashboard-card--content-full-width': fullWidth,
        [`${className}`]: className !== undefined,
      }),
    [className, fullWidth, opened],
  );

  return (
    <div className={classes}>
      <header className="dashboard-card__header">
        <div>{header}</div>
        {expandable && (
          <Button onClick={toggle} color="tertiary" size="small">
            <Icon
              name={IconTypeEnum.CHEVRON_DOWN_OUTLINE}
              data-testid="dashboard-card__header__toggle"
            />
          </Button>
        )}
      </header>
      <div
        className="dashboard-card__wrapper"
        style={{ height: wrapperHeight }}
        data-testid="dashboard-card__wrapper"
      >
        <div className="dashboard-card__expandable" ref={expandableRef}>
          <div className="dashboard-card__content">{children}</div>
          {!!footer && <footer className="dashboard-card__footer">{footer}</footer>}
        </div>
      </div>
    </div>
  );
};
