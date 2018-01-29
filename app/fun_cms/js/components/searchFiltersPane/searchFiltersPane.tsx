import * as React from "react";
import { Subscription } from 'rxjs/Subscription';

import { FilterDefinition } from '../../types/FilterDefinition';
import { SearchFilterGroup } from '../searchFilterGroup/searchFilterGroup';
import filters$ from '../../data/search/filters';

interface SearchFiltersPaneState {
  filters: Array<FilterDefinition>,
  filtersSubscription?: Subscription;
}

export interface SearchFiltersPaneProps {}

export class SearchFiltersPane extends React.Component<SearchFiltersPaneProps, SearchFiltersPaneState> {
  constructor (props: SearchFiltersPaneProps) {
    super(props);

    this.state = {
      filters: [],
    };
  }

  componentDidMount () {
    this.setState({
      filtersSubscription: filters$.subscribe((filters) => {
        this.setState({ filters });
      }),
    });
  }

  componentWillUnmount () {
    if (this.state.filtersSubscription) {
      this.state.filtersSubscription.unsubscribe();
    }
  }

  render () {
    const { filters } = this.state;
    
    return <div className="search-filters-pane">
      <h2 className="search-filters-pane__title">Filter results</h2>
      {filters.map(filter =>
        <SearchFilterGroup filter={filter} />
      )}
    </div>    
  }
}