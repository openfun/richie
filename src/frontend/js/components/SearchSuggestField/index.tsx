import debounce from 'lodash-es/debounce';
import React, { useContext, useRef, useState } from 'react';
import Autosuggest from 'react-autosuggest';
import { defineMessages, useIntl } from 'react-intl';

import {
  getRelevantFilter,
  getSuggestionValue,
  onSuggestionsFetchRequested,
  renderSuggestion,
} from 'common/searchFields';
import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { APICourseSearchResponse } from 'types/api';
import {
  SearchAutosuggestProps,
  SearchSuggestionSection,
} from 'types/Suggestion';

const messages = defineMessages({
  searchFieldPlaceholder: {
    defaultMessage: 'Search for courses, organizations, categories',
    description:
      'Placeholder text displayed in the search field when it is empty.',
    id: 'components.SearchSuggestField.searchFieldPlaceholder',
  },
});

/**
 * Props shape for the SearchSuggestField component.
 */
export interface SearchSuggestFieldProps {
  filters: APICourseSearchResponse['filters'];
}

/**
 * Component. Displays the main search field alon with any suggestions organized in relevant sections.
 * @param filters Filter definitions for all the potential suggestable filters.
 */
export const SearchSuggestField = ({ filters }: SearchSuggestFieldProps) => {
  const intl = useIntl();
  // Setup our filters updates (for full-text-search and specific filters) directly through the
  // search parameters hook.
  const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
    CourseSearchParamsContext,
  );

  // Initialize hooks for the two pieces of state the controlled <Autosuggest> component needs to interact with:
  // the current list of suggestions and the input value.
  // Note: the input value is initialized from the courseSearchParams, ie. the `query` query string parameter
  const [value, setValue] = useState(courseSearchParams.query || '');
  const [suggestions, setSuggestions] = useState<SearchSuggestionSection[]>([]);

  /**
   * Helper to update the course search params when the user types. We needed to take it out of
   * the `onChange` handler to wrap it in a `debounce` (and therefore a `useRef` to make the
   * debouncing effective).
   * @param _ Unused: change event.
   * @param params Incoming parameters related to the change event.
   * - `method` is the way the value was updated.
   * - `newValue` is the search suggest form field value.
   */
  const searchAsTheUserTypes: SearchAutosuggestProps['inputProps']['onChange'] = (
    _,
    { method, newValue },
  ) => {
    if (method === 'type' && (newValue.length === 0 || newValue.length >= 3)) {
      dispatchCourseSearchParamsUpdate({
        query: newValue,
        type: 'QUERY_UPDATE',
      });
    }
  };
  const updateCourseSearchParamsRef = useRef(
    debounce(searchAsTheUserTypes, 500, { maxWait: 1100 }),
  );

  const inputProps: SearchAutosuggestProps['inputProps'] = {
    /**
     * Callback triggered on every user input.
     * @param _ Unused: change event.
     * @param params Incoming parameters related to the change event.
     * - `method` is the way the value was updated.
     * - `newValue` is the search suggest form field value.
     */
    onChange: (_, { method, newValue }) => {
      // Always update the state, delegate search-as-the-user-types to debounced function
      setValue(newValue);
      updateCourseSearchParamsRef.current(_, { method, newValue });
    },
    onKeyDown: event => {
      if (event.keyCode === 13 /* enter */ && !value) {
        dispatchCourseSearchParamsUpdate({
          query: '',
          type: 'QUERY_UPDATE',
        });
      }
    },
    placeholder: intl.formatMessage(messages.searchFieldPlaceholder),
    value,
  };

  /**
   * `react-autosuggest` callback triggered when the user picks a suggestion, to handle the interaction.
   * Different interactions have different expected outcomes:
   * - picking a course directs to the course detailed page (as this is a course search);
   * - picking another resource suggestion adds that resource as a filter;
   * - the default suggestion runs a full-text search on the content of the search suggest form field.
   * @param _ Unused: selection event.
   * @param suggestion `suggestion` as key to an anonymous object: the suggestion the user picked.
   */
  const onSuggestionSelected: SearchAutosuggestProps['onSuggestionSelected'] = (
    _,
    { suggestion },
  ) => {
    const filter = getRelevantFilter(filters, suggestion);

    // Dispatch the actual update on the relevant filter
    dispatchCourseSearchParamsUpdate({
      filter,
      payload: String(suggestion.id),
      type: 'FILTER_ADD',
    });
    // Clear the current search query as the selected suggestion was generated from the same user input
    dispatchCourseSearchParamsUpdate({
      query: '',
      type: 'QUERY_UPDATE',
    });
    // Reset the search field state: the task has been completed
    setValue('');
    setSuggestions([]);
  };

  return (
    // TypeScript incorrectly infers the type of the Autosuggest suggestions prop as SearchSuggestion, which
    // would be correct if we did not use sections, but is incorrect as it is.
    <Autosuggest
      getSectionSuggestions={section => section.values}
      getSuggestionValue={getSuggestionValue}
      inputProps={inputProps}
      multiSection={true}
      onSuggestionsClearRequested={() => setSuggestions([])}
      onSuggestionsFetchRequested={({ value: incomingValue }) =>
        onSuggestionsFetchRequested(filters, setSuggestions, incomingValue)
      }
      onSuggestionSelected={onSuggestionSelected}
      renderSectionTitle={section => section.title}
      renderSuggestion={renderSuggestion}
      shouldRenderSuggestions={val => val.length > 2}
      suggestions={suggestions as any}
    />
  );
};
