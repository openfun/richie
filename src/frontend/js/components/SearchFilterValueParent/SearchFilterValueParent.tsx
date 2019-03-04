import React, { useState } from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';

import { useFilterValue } from '../../data/useFilterValue/useFilterValue';
import { FilterDefinition, FilterValue } from '../../types/filters';
import { CloseIcon } from '../icons/CloseIcon';
import { SearchFilterValueLeaf } from '../SearchFilterValueLeaf/SearchFilterValueLeaf';

const messages = defineMessages({
  ariaHideChildren: {
    defaultMessage: 'Hide child filters',
    description:
      'Accessibility message for the button to hide children of the current filter',
    id: 'components.SearchFilterValueParent.ariaHideChildren',
  },
  ariaShowChildren: {
    defaultMessage: 'Show child filters',
    description:
      'Accessibility message for the button to show children of the current filter',
    id: 'components.SearchFilterValueParent.ariaShowChildren',
  },
});

interface SearchFilterValueParentProps {
  filter: FilterDefinition;
  value: FilterValue;
}

export const SearchFilterValueParent = injectIntl(
  ({
    filter,
    intl,
    value,
  }: SearchFilterValueParentProps & InjectedIntlProps) => {
    // Hide children by default, unless at least one of them is currently active
    const [showChildren, setShowChildren] = useState(
      value.children!.some(childValue => useFilterValue(filter, childValue)[0]),
    );

    const [isActive, toggle] = useFilterValue(filter, value);

    return (
      <div className="search-filter-value-parent">
        <div className="search-filter-value-parent__self">
          <button
            aria-label={intl.formatMessage(
              showChildren
                ? messages.ariaHideChildren
                : messages.ariaShowChildren,
            )}
            aria-pressed={showChildren}
            className={`search-filter-value-parent__self__unfold ${showChildren &&
              'search-filter-value-parent__self__unfold--open'}`}
            onClick={() => setShowChildren(!showChildren)}
          >
            &gt;
          </button>
          <button
            className={`search-filter-value-parent__self__btn ${
              isActive ? 'active' : ''
            }`}
            onClick={toggle}
            aria-pressed={isActive}
          >
            <span className="search-filter-value-parent__self__btn__name">
              {value.human_name}
            </span>
            {!isActive && (value.count || value.count === 0) ? (
              <span className="search-filter-value-parent__self__btn__count">
                {value.count}
              </span>
            ) : (
              ''
            )}
            {isActive ? <CloseIcon /> : ''}
          </button>
        </div>
        {showChildren && (
          <div className="search-filter-value-parent__children">
            {value.children!.map(childValue => (
              <SearchFilterValueLeaf
                filter={filter}
                key={childValue.key}
                value={childValue}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);
