import React, { useContext, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntl,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { APICourseSearchResponse } from '../../types/api';
import { modelName } from '../../types/models';
import {
  ResourceSuggestionSection,
  SearchSuggestion,
  SearchSuggestionSection,
} from '../../types/searchSuggest';
import { commonMessages } from '../../utils/commonMessages';
import { handle } from '../../utils/errors/handle';
import { location } from '../../utils/indirection/window';
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
    defaultMessage: 'Search for courses, organizations, categories',
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
 * @param setValue [curried] `useState` setter for the `value` on component state.
 * @param event Unused: change event.
 * @param params Incoming parameters related to the change event. Includes `newValue` as key
 * with the search suggest form field value.
 */
export const onChange = (setValue: valueSetter) => (
  event: React.FormEvent<any>,
  params?: { newValue: string },
) => (params ? setValue(params.newValue) : null);

/**
 * `react-autosuggest` callback to build up the list of suggestions and sections whenever user
 * interaction requires us to create or update that list.
 * @param setSuggestions [curried] `useState` setter for the `suggestions` on component state
 * @param value `value` as key to an anonymous object: the current value of the search suggest form field.
 */
export const onSuggestionsFetchRequested = (
  setSuggestions: suggestionsSetter,
) => async ({ value }: { value: string }) => {
  if (value.length < 3) {
    return setSuggestions([]);
  }

  // List the resource-based sections we'll display and the models they're related to
  const sectionParams: Array<
    [ResourceSuggestionSection['model'], FormattedMessage.MessageDescriptor]
  > = [
    [modelName.COURSES, commonMessages.coursesHumanName],
    [modelName.ORGANIZATIONS, commonMessages.organizationsHumanName],
    [modelName.CATEGORIES, commonMessages.categoriesHumanName],
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

  setSuggestions([
    // Add the default section on top of the list
    {
      message: null,
      model: null,
      value,
    },
    // Drop sections with no results as there's no use displaying them
    ...sections.filter(section => !!section!.values.length),
  ]);
};

/**
 * `react-autosuggest` callback triggered when the user picks a suggestion, to handle the interaction.
 * Different interactions have different expected outcomes:
 * - picking a course directs to the course detailed page (as this is a course search);
 * - picking another resource suggestion adds that resource as a filter;
 * - the default suggestion runs a full-text search on the content of the search suggest form field.
 * @param setValue [curried] `useState` setter for the `value` on component state.
 * @param setSuggestions [curried] `useState` setter for the `suggestions` on component state
 * @param addFilter [curried] Function that adds a filter to the `CourseSearchParams` context.
 * @param updateFullTextSearch [curried] Function that updates the query in the `CourseSearchParams` context.
 * @param event Unused: selection event.
 * @param suggestion `suggestion` as key to an anonymous object: the suggestion the user picked.
 */
export const onSuggestionSelected = (
  setValue: valueSetter,
  setSuggestions: suggestionsSetter,
  addFilter: (payload: string) => void,
  updateFullTextSearch: (query: string) => void,
) => (
  event: React.FormEvent,
  { suggestion }: { suggestion: SearchSuggestion },
) => {
  switch (suggestion.model) {
    case modelName.COURSES:
      // Behave like a link to the course run's page
      return (location.href = suggestion.data.absolute_url);

    case modelName.ORGANIZATIONS:
    case modelName.CATEGORIES:
      // Update the search with the newly selected filter
      addFilter(String(suggestion.data.id));
      // Reset the search field state: the task has been completed
      setValue('');
      setSuggestions([]);
      break;

    default:
      // Update the current query with the default suggestion data (the contents of the search query)
      updateFullTextSearch(suggestion.data);
      break;
  }
};

interface SearchSuggestFieldState {
  suggestions: SearchSuggestionSection[];
  value: string;
}

type valueSetter = React.Dispatch<
  React.SetStateAction<SearchSuggestFieldState['value']>
>;

type suggestionsSetter = React.Dispatch<
  React.SetStateAction<SearchSuggestFieldState['suggestions']>
>;

/**
 * Props shape for the SearchSuggestField component.
 */
export interface SearchSuggestFieldProps {
  filters: APICourseSearchResponse['filters'];
}

/**
 * Non-wrapped component. Exported for testing purposes only. See SearchSuggestField.
 */
export const SearchSuggestFieldBase = ({
  filters,
  intl,
}: SearchSuggestFieldProps & InjectedIntlProps) => {
  // Setup our filters updates (for full-text-search and specific filters) directly through the
  // search parameters hook.
  const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
    CourseSearchParamsContext,
  );
  // When the user types some text, the default suggestion is to use it as a full text query
  const updateFullTextSearch = (query: string) =>
    dispatchCourseSearchParamsUpdate({
      query,
      type: 'QUERY_UPDATE',
    });

  // Helper to add a filter to the current search and query string parameters when the user selects a
  // filter value from one of our autocomplete APIs.
  const addFilter = (payload: string) => {
    // Pick the filter to update based on the payload's path: it contains the relevant filter's page path
    // (for eg. a meta-category or the "organizations" root page)
    const filter = Object.values(filters).find(
      fltr => !!fltr.base_path && payload.substr(2).startsWith(fltr.base_path),
    )!;

    dispatchCourseSearchParamsUpdate({
      filter,
      payload,
      type: 'FILTER_ADD',
    });
  };

  // Initialize hooks for the two pieces of state the controlled <Autosuggest> component needs to interact with:
  // the current list of suggestions and the input value.
  // Note: the input value is initialized from the courseSearchParams, ie. the `query` query string parameter
  const [value, setValue] = useState(courseSearchParams.query || '');
  const [suggestions, setSuggestions] = useState<
    SearchSuggestFieldState['suggestions']
  >([]);

  const inputProps = {
    onChange: onChange(setValue),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.keyCode === 13 /* enter */ && !value) {
        updateFullTextSearch('');
      }
    },
    placeholder: intl.formatMessage(messages.searchFieldPlaceholder),
    value,
  };

  return (
    // TypeScript incorrectly infers the type of the Autosuggest suggestions prop as SearchSuggestion, which
    // would be correct if we did not use sections, but is incorrect as it is.
    <Autosuggest
      getSectionSuggestions={suggestionsFromSection as any}
      getSuggestionValue={getSuggestionValue}
      highlightFirstSuggestion={value.length > 2}
      inputProps={inputProps}
      multiSection={true}
      onSuggestionsClearRequested={() => setSuggestions([])}
      onSuggestionsFetchRequested={onSuggestionsFetchRequested(setSuggestions)}
      onSuggestionSelected={onSuggestionSelected(
        setValue,
        setSuggestions,
        addFilter,
        updateFullTextSearch,
      )}
      renderSectionTitle={renderSectionTitle.bind(null, intl)}
      renderSuggestion={renderSuggestion}
      shouldRenderSuggestions={val => val.length > 2}
      suggestions={suggestions as any}
    />
  );
};

/**
 * Component. Displays the main search field alon with any suggestions organized in relevant sections.
 * @param filters Filter definitions for all the potential suggestable filters.
 */
export const SearchSuggestField = injectIntl(SearchSuggestFieldBase);
