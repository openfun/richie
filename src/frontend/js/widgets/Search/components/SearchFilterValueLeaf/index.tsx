import { memo } from 'react';

import { FacetedFilterDefinition, FilterValue } from 'types/filters';
import { useFilterValue } from '../../hooks/useFilterValue';

export interface SearchFilterValueLeafProps {
  filter: FacetedFilterDefinition;
  value: FilterValue;
}

const SearchFilterValueLeafBase = ({ filter, value }: SearchFilterValueLeafProps) => {
  const [isActive, toggle] = useFilterValue(filter, value);

  return (
    <label
      className={`search-filter-value-leaf ${isActive ? 'active' : ''} ${
        value.count === 0 ? 'search-filter-value-leaf--disabled' : ''
      }`}
    >
      <input
        checked={isActive}
        className="search-filter-value-leaf__checkbox"
        disabled={value.count === 0}
        onChange={toggle}
        type="checkbox"
      />
      <div className="search-filter-value-leaf__content">
        {value.human_name}&nbsp;
        {value.count || value.count === 0 ? `(${value.count})` : ''}
      </div>
    </label>
  );
};

const areEqual: (
  prevProps: Readonly<SearchFilterValueLeafProps>,
  newProps: Readonly<SearchFilterValueLeafProps>,
) => boolean = (prevProps, newProps) => prevProps.value.count === newProps.value.count;

export const SearchFilterValueLeaf = memo(SearchFilterValueLeafBase, areEqual);
