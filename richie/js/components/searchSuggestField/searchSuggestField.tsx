import * as React from 'react';
import * as Autosuggest from 'react-autosuggest';

import {
  SearchSuggestion,
  SearchSuggestionSection,
} from '../../types/searchSuggest';
import { handle } from '../../utils/errors/handle';
import { location } from '../../utils/indirection/location';
import { getSuggestionsSection } from '../../utils/searchSuggest/getSuggestionsSection';
import { suggestionHumanName } from '../../utils/searchSuggest/suggestionHumanName';
import { suggestionsFromSection } from '../../utils/searchSuggest/suggestionsFromSection';

interface SearchSuggestFieldState {
  suggestions: SearchSuggestionSection[];
  value: string;
}

export interface SearchSuggestFieldProps {
  addFilter: (filterName: string, filterValue: string) => void;
}

export const renderSuggestion = (suggestion: SearchSuggestion) => (
  <span>{suggestionHumanName(suggestion)}</span>
);

export const renderSectionTitle = (section: SearchSuggestionSection) => (
  <span>{section.title}</span>
);

export function onChange(
  this: SearchSuggestField,
  event: React.FormEvent<any>,
  params?: { newValue: string },
) {
  if (params) {
    this.setState({
      value: params.newValue,
    });
  }
}

export function onSuggestionsClearRequested(this: SearchSuggestField) {
  this.setState({
    suggestions: [],
  });
}

export async function onSuggestionsFetchRequested(
  this: SearchSuggestField,
  { value }: { value: string },
) {
  if (value.length < 3) {
    return this.setState({ suggestions: [] });
  }

  // List the sections we'll display and the models they're related to
  const sectionParams: Array<[SearchSuggestionSection['model'], string]> = [
    ['courses', 'Courses'],
    ['organizations', 'Organizations'],
    ['subjects', 'Subjects'],
  ];

  // Fetch the suggestions for each section to build out the sections
  let sections: SearchSuggestionSection[];
  try {
    sections = (await Promise.all(
      sectionParams.map(([model, title]) =>
        getSuggestionsSection(model, title, value),
      ),
    )) as SearchSuggestionSection[]; // We can assert this because of the catch below
  } catch (error) {
    return handle(error);
  }

  // Drop sections with no results as there's no use displaying them
  this.setState({
    suggestions: sections.filter(section => !!section!.values.length),
  });
}

export function onSuggestionSelected(
  this: SearchSuggestField,
  event: Event,
  { suggestion }: { suggestion: SearchSuggestion },
) {
  switch (suggestion.model) {
    case 'courses':
      // TODO: pick a real URL on the course object when it is available on the API
      const url = 'https://' + suggestion.data.id;
      return location.setHref(url);

    case 'organizations':
    case 'subjects':
      // Update the search with the newly selected filter
      this.props.addFilter(suggestion.model, String(suggestion.data.id));
      // Reset the search field state: the task has been completed
      this.setState({
        suggestions: [],
        value: '',
      });
  }
}

export class SearchSuggestField extends React.Component<
  SearchSuggestFieldProps,
  SearchSuggestFieldState
> {
  constructor(props: SearchSuggestFieldProps) {
    super(props);
    this.state = { suggestions: [], value: '' };
  }

  render() {
    const { suggestions, value } = this.state;
    const inputProps = {
      onChange: onChange.bind(this),
      placeholder: 'Search for courses, organizations, subjects',
      value,
    };

    return (
      // TypeScript incorrectly infers the type of the Autosuggest suggestions prop as SearchSuggestion, which
      // would be correct if we did not use sections, but is incorrect as it is.
      <Autosuggest
        suggestions={suggestions as any}
        getSuggestionValue={suggestionHumanName}
        onSuggestionsClearRequested={onSuggestionsClearRequested.bind(this)}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested.bind(this)}
        onSuggestionSelected={onSuggestionSelected.bind(this)}
        renderSuggestion={renderSuggestion}
        multiSection={true}
        getSectionSuggestions={suggestionsFromSection}
        renderSectionTitle={renderSectionTitle}
        inputProps={inputProps}
      />
    );
  }
}
