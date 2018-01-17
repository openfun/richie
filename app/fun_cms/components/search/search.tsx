import * as React from "react";

import { Course } from '../../types/Course';
import courses from '../../api_response';

interface SearchState {
  courses: Course[];
}

export interface SearchProps {}

export class Search extends React.Component<SearchProps, SearchState> {
  constructor (props: SearchProps) {
    super(props);

    this.state = {
      courses: courses.results,
    };
  }

  render() {
    const { courses } = this.state;
    return <div className="search">
      <div className="search__filters">
      </div>
      <div className="search__results">
      </div>
    </div>;
  }
}
