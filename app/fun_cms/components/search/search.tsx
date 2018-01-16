import * as React from "react";

export interface SearchProps { example: string; }

export class Search extends React.Component<SearchProps, {}> {
  render() {
    return <h1>Hello from {this.props.example} and DjangoCMS!</h1>;
  }
}
