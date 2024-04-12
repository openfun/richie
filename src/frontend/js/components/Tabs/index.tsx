import { Button } from '@openfun/cunningham-react';
import classNames from 'classnames';
import {
  Children,
  Dispatch,
  PropsWithChildren,
  ReactElement,
  SetStateAction,
  cloneElement,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { noop } from 'utils';

interface TabProps extends PropsWithChildren {
  name: string;
  href?: string;
  isActive?: boolean;
  setActiveTabName?: Dispatch<SetStateAction<string>>;
  onClick?: () => void;
}

/**
 * Tab must be used inside a Tabs component.
 * `isActive` and `setActiveTabName` shouldn't be given to Tab component.
 * These props are populated by Tabs parent component.
 */
const Tab = ({
  name,
  href,
  onClick,
  isActive = false,
  setActiveTabName = noop,
  children,
}: TabProps) => {
  const navigate = useNavigate();
  const handleOnClick = () => {
    setActiveTabName?.(name);
    onClick?.();
    if (href) {
      navigate(href);
    }
  };

  return (
    <div className="tabs__tab">
      <Button
        color="tertiary-text"
        onClick={handleOnClick}
        className={classNames('c__button--tab', {
          'c__button--active': isActive,
        })}
      >
        {children}
      </Button>
    </div>
  );
};

interface TabsProps {
  initialActiveTabName?: string;
  children: ReactElement<TabProps>[];
}

const Tabs = ({ initialActiveTabName, children }: TabsProps) => {
  const [activeTabName, setActiveTabName] = useState(
    initialActiveTabName ?? children[0].props.name,
  );
  return (
    <div className="tabs" data-testid="tabs-header">
      {Children.map(children, (child) =>
        cloneElement(child, { isActive: child.props.name === activeTabName, setActiveTabName }),
      )}
    </div>
  );
};

Tabs.Tab = Tab;

export default Tabs;
