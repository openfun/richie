import * as React from 'react';

export interface SearchFilterGroupProps {
  filter: string[];
}

export const SearchFilter = (props: SearchFilterGroupProps) => {
  const { filter } = props;

  return <button className="search-filter">
    {filter[1]}
    <span className="search-filter__count">358</span>
  </button>;
};

export default SearchFilter;
