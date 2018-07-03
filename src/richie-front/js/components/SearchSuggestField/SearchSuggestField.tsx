import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntl,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';

import {
  SearchSuggestion,
  SearchSuggestionSection,
} from '../../types/searchSuggest';
import { commonMessages } from '../../utils/commonMessages';
import { handle } from '../../utils/errors/handle';
import { location } from '../../utils/indirection/location';
import { getSuggestionsSection } from '../../utils/searchSuggest/getSuggestionsSection';
import { suggestionHumanName } from '../../utils/searchSuggest/suggestionHumanName';
import { suggestionsFromSection } from '../../utils/searchSuggest/suggestionsFromSection';

interface SearchSuggestFieldState {
  suggestions: SearchSuggestionSection[];
  value: string;
}

const messages = defineMessages({
  searchFieldPlaceholder: {
    defaultMessage: 'Search for courses, organizations, subjects',
    description:
      'Placeholder text displayed in the search field when it is empty.',
    id: 'components.SearchSuggestField.searchFieldPlaceholder',
  },
});

export interface SearchSuggestFieldProps {
  addFilter: (filterName: string, filterValue: string) => void;
}

export const renderSuggestion = (suggestion: SearchSuggestion) => (
  <span>{suggestionHumanName(suggestion)}</span>
);

export const renderSectionTitle = (
  intl: InjectedIntl,
  section: SearchSuggestionSection,
) => <span>{intl.formatMessage(section.message)}</span>;

export function onChange(
  this: SearchSuggestFieldBase,
  event: React.FormEvent<any>,
  params?: { newValue: string },
) {
  if (params) {
    this.setState({
      value: params.newValue,
    });
  }
}

export function onSuggestionsClearRequested(this: SearchSuggestFieldBase) {
  this.setState({
    suggestions: [],
  });
}

export async function onSuggestionsFetchRequested(
  this: SearchSuggestFieldBase,
  { value }: { value: string },
) {
  if (value.length < 3) {
    return this.setState({ suggestions: [] });
  }

  // List the sections we'll display and the models they're related to
  const sectionParams: Array<
    [SearchSuggestionSection['model'], FormattedMessage.MessageDescriptor]
  > = [
    ['courses', commonMessages.coursesHumanName],
    ['organizations', commonMessages.organizationsHumanName],
    ['subjects', commonMessages.subjectsHumanName],
  ];

  // Fetch the suggestions for each section to build out the sections
  let sections: SearchSuggestionSection[];
  try {
    sections = (await Promise.all(
      sectionParams.map(([model, message]) =>
        getSuggestionsSection(model, message, value),
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
  this: SearchSuggestFieldBase,
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

export class SearchSuggestFieldBase extends React.Component<
  SearchSuggestFieldProps & InjectedIntlProps,
  SearchSuggestFieldState
> {
  constructor(props: SearchSuggestFieldProps & InjectedIntlProps) {
    super(props);
    this.state = { suggestions: [], value: '' };
  }

  render() {
    const { suggestions, value } = this.state;
    const { intl } = this.props;
    const inputProps = {
      onChange: onChange.bind(this),
      placeholder: intl.formatMessage(messages.searchFieldPlaceholder),
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
        renderSectionTitle={renderSectionTitle.bind(null, intl)}
        inputProps={inputProps}
      />
    );
  }
}

export const SearchSuggestField = injectIntl(SearchSuggestFieldBase);
