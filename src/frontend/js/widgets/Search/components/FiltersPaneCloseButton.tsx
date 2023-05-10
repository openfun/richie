import { defineMessages, FormattedMessage } from 'react-intl';
import { Icon, IconTypeEnum } from 'components/Icon';

const messages = defineMessages({
  hideFiltersPane: {
    defaultMessage: 'Hide filters pane',
    description:
      'Accessibility text for the button/icon that toggles *off* the filters pane on mobile',
    id: 'components.Search.hideFiltersPane',
  },
  showFiltersPane: {
    defaultMessage: 'Show filters pane',
    description:
      'Accessibility text for the button/icon that toggles *on* the filters pane on mobile',
    id: 'components.Search.showFiltersPane',
  },
});

interface FiltersPaneCloseButtonProps {
  expanded: boolean;
  controls: string;
  onClick: () => void;
  type?: 'top' | 'bottom';
}

const FiltersPaneCloseButton = ({
  expanded,
  controls,
  onClick,
  type = 'top',
}: FiltersPaneCloseButtonProps) => {
  const iconName = expanded ? IconTypeEnum.CROSS : IconTypeEnum.FILTER;
  const message = expanded ? messages.hideFiltersPane : messages.showFiltersPane;
  return (
    <button
      aria-expanded={expanded}
      aria-controls={controls}
      className={`search__filters__toggle search__filters__toggle--${type}`}
      onClick={onClick}
    >
      <Icon name={iconName} className="search__filters__toggle__icon" />{' '}
      <span className="offscreen">
        <FormattedMessage {...message} />
      </span>
    </button>
  );
};

export default FiltersPaneCloseButton;
