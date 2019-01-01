import * as React from 'react';
import Autosuggest from 'react-autosuggest';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntl,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';

import { filterGroupName } from '../../types/filters';
import { modelName } from '../../types/models';
import {
  ResourceSuggestionSection,
  SearchSuggestion,
  SearchSuggestionSection,
} from '../../types/searchSuggest';
import { commonMessages } from '../../utils/commonMessages';
import { handle } from '../../utils/errors/handle';
import { location } from '../../utils/indirection/location';
import { getSuggestionsSection } from '../../utils/searchSuggest/getSuggestionsSection';
import { suggestionHumanName } from '../../utils/searchSuggest/suggestionHumanName';
import { suggestionsFromSection } from '../../utils/searchSuggest/suggestionsFromSection';

const messages = defineMessages({
  searchFieldDefaultSearch: {
    defaultMessage: 'Search for {query} in courses...',
    description: `Default query in the main search field. Lets users run a full text search
      with whatever they have typed in.`,
    id: 'components.SearchSuggestField.searchFieldDefaultSearch',
  },
  searchFieldPlaceholder: {
    defaultMessage: 'Search for courses, organizations, subjects',
    description:
      'Placeholder text displayed in the search field when it is empty.',
    id: 'components.SearchSuggestField.searchFieldPlaceholder',
  },
});

/**
 * `react-autosuggest` callback to get a human string value from a Suggestion object.
 * @param suggestion The relevant suggestion object.
 */
export const getSuggestionValue = (suggestion: SearchSuggestion) =>
  suggestion.model ? suggestionHumanName(suggestion) : suggestion.data;

/**
 * `react-autosuggest` callback to render one suggestion.
 * @param suggestion Either a resource suggestion with a model name & a machine name, or the default
 * suggestion with some text to render.
 */
export const renderSuggestion = (suggestion: SearchSuggestion) => {
  // Default suggestion is just packing a message in its data field
  if (!suggestion.model) {
    return (
      <FormattedMessage
        {...messages.searchFieldDefaultSearch}
        values={{ query: <b>{suggestion.data}</b> }}
      />
    );
  }
  // Resource suggestions need the machine name => human name translation
  return <span>{suggestionHumanName(suggestion)}</span>;
};

/**
 * `react-autosuggest` callback to render one suggestion section.
 * @param intl The injected Intl object from react-intl's injectIntl HOC.
 * @param section A suggestion section based on a resource. renderSectionTitle() is never called with
 * the default section as that section has no title.
 */
export const renderSectionTitle = (
  intl: InjectedIntl,
  section: SearchSuggestionSection,
) =>
  section.model ? <span>{intl.formatMessage(section.message)}</span> : null;

/**
 * `react-autosuggest` callback triggered on every used input.
 * @param this Mandatory binding to SearchSuggestFieldBase to access state.
 * @param event Unused: change event.
 * @param params Incoming parameters related to the change event. Includes `newValue` as key
 * with the search suggest form field value.
 */
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

/**
 * `react-autosuggest` callback to handle clearing of all active suggestions
 * @param this Mandatory binding to SearchSuggestFieldBase to access state.
 */
export function onSuggestionsClearRequested(this: SearchSuggestFieldBase) {
  this.setState({
    suggestions: [],
  });
}

/**
 * `react-autosuggest` callback to build up the list of suggestions and sections whenever user
 * interaction requires us to create or update that list.
 * @param this Mandatory binding to SearchSuggestFieldBase to access state.
 * @param value `value` as key to an anonymous object: the current value of the search suggest form field.
 */
export async function onSuggestionsFetchRequested(
  this: SearchSuggestFieldBase,
  { value }: { value: string },
) {
  if (value.length < 3) {
    return this.setState({ suggestions: [] });
  }

  // List the resource-based sections we'll display and the models they're related to
  const sectionParams: Array<
    [ResourceSuggestionSection['model'], FormattedMessage.MessageDescriptor]
  > = [
    [modelName.COURSES, commonMessages.coursesHumanName],
    [modelName.ORGANIZATIONS, commonMessages.organizationsHumanName],
    [modelName.SUBJECTS, commonMessages.subjectsHumanName],
  ];

  // Fetch the suggestions for each resource-based section to build out the sections
  let sections: ResourceSuggestionSection[];
  try {
    sections = (await Promise.all(
      sectionParams.map(([model, message]) =>
        getSuggestionsSection(model, message, value),
      ),
    )) as ResourceSuggestionSection[]; // We can assert this because of the catch below
  } catch (error) {
    return handle(error);
  }

  this.setState({
    suggestions: [
      // Add the default section on top of the list
      {
        message: null,
        model: null,
        value,
      },
      // Drop sections with no results as there's no use displaying them
      ...sections.filter(section => !!section!.values.length),
    ],
  });
}

/**
 * `react-autosuggest` callback triggered when the user picks a suggestion, to handle the interaction.
 *
 * Different interactions have different expected outcomes:
 * - picking a course directs to the course detailed page (as this is a course search);
 * - picking another resource suggestion adds that resource as a filter;
 * - the default suggestion runs a full-text search on the content of the search suggest form field.
 * @param this Mandatory binding to SearchSuggestFieldBase to access state.
 * @param event Unused: selection event.
 * @param suggestion `suggestion` as key to an anonymous object: the suggestion the user picked.
 */
export function onSuggestionSelected(
  this: SearchSuggestFieldBase,
  event: React.FormEvent,
  { suggestion }: { suggestion: SearchSuggestion },
) {
  switch (suggestion.model) {
    case modelName.COURSES:
      // TODO: pick a real URL on the course object when it is available on the API
      const url = 'https://' + suggestion.data.id;
      return location.setHref(url);

    case modelName.ORGANIZATIONS:
    case modelName.SUBJECTS:
      // Update the search with the newly selected filter
      this.props.addFilter(suggestion.model, String(suggestion.data.id));
      // Reset the search field state: the task has been completed
      this.setState({
        suggestions: [],
        value: '',
      });
      break;

    default:
      // Update the current query with the default suggestion data (the contents of the search query)
      this.props.fullTextSearch(suggestion.data);
      break;
  }
}

interface SearchSuggestFieldState {
  suggestions: SearchSuggestionSection[];
  value: string;
}

/**
 * Props shape for the SearchSuggestField component.
 */
export interface SearchSuggestFieldProps {
  addFilter: (filterName: filterGroupName, filterValue: string) => void;
  fullTextSearch: (query: string) => void;
}

/**
 * Non-wrapped component. Exported for testing purposes only. See SearchSuggestField.
 */
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
        getSuggestionValue={getSuggestionValue}
        highlightFirstSuggestion={true}
        onSuggestionsClearRequested={onSuggestionsClearRequested.bind(this)}
        onSuggestionsFetchRequested={onSuggestionsFetchRequested.bind(this)}
        onSuggestionSelected={onSuggestionSelected.bind(this)}
        renderSuggestion={renderSuggestion}
        multiSection={true}
        getSectionSuggestions={suggestionsFromSection as any}
        renderSectionTitle={renderSectionTitle.bind(null, intl)}
        inputProps={inputProps}
      />
    );
  }
}

/**
 * Component. Displays the main search field alon with any suggestions organized in relevant sections.
 * @param addFilter Store helper to add a new active value for a filter.
 */
export const SearchSuggestField = injectIntl(SearchSuggestFieldBase);
