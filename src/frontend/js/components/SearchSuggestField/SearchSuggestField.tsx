import debounce from 'lodash-es/debounce';
import React, { useContext, useRef, useState } from 'react';
import Autosuggest, { AutosuggestProps } from 'react-autosuggest';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { APICourseSearchResponse } from '../../types/api';
import { Suggestion, SuggestionSection } from '../../types/Suggestion';
import { handle } from '../../utils/errors/handle';
import { getSuggestionsSection } from './getSuggestionsSection';

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
 * Define the kind of suggestions our `<SearchSuggestField />` component supports.
 */
type SearchSuggestion = Suggestion<'categories' | 'organizations' | 'persons'>;

/**
 * Derive from `SearchSuggestion` the kind of suggestion sections our `<SearchSuggestField />` component supports.
 */
type SearchSuggestionSection = SuggestionSection<SearchSuggestion>;

/**
 * Helper to typecheck `react-autosuggest` expected props. Defines what is acceptable as a suggestion
 * throughout our code related to this instance of `<Autosuggest />`.
 */
type SearchAutosuggestProps = AutosuggestProps<SearchSuggestion>;

/**
 * `react-autosuggest` callback to get a human string value from a Suggestion object.
 * @param suggestion The relevant suggestion object.
 */
const getSuggestionValue: SearchAutosuggestProps['getSuggestionValue'] = suggestion =>
  suggestion.title;

/**
 * `react-autosuggest` callback to render one suggestion.
 * @param suggestion Either a resource suggestion with a model name & a machine name, or the default
 * suggestion with some text to render.
 */
const renderSuggestion: SearchAutosuggestProps['renderSuggestion'] = suggestion => (
  <span>{suggestion.title}</span>
);

/**
 * State shape for the SearchSuggestField component.
 */
interface SearchSuggestFieldState {
  suggestions: SearchSuggestionSection[];
  value: string;
}

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
export const SearchSuggestField = injectIntl(
  ({ filters, intl }: SearchSuggestFieldProps & InjectedIntlProps) => {
    // Setup our filters updates (for full-text-search and specific filters) directly through the
    // search parameters hook.
    const [courseSearchParams, dispatchCourseSearchParamsUpdate] = useContext(
      CourseSearchParamsContext,
    );

    // Initialize hooks for the two pieces of state the controlled <Autosuggest> component needs to interact with:
    // the current list of suggestions and the input value.
    // Note: the input value is initialized from the courseSearchParams, ie. the `query` query string parameter
    const [value, setValue] = useState(courseSearchParams.query || '');
    const [suggestions, setSuggestions] = useState<
      SearchSuggestFieldState['suggestions']
    >([]);

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
      if (
        method === 'type' &&
        (newValue.length === 0 || newValue.length >= 3)
      ) {
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
      // Update the search with the newly selected filter value, using the `kind` field on the suggestion to
      // pick the relevant filter to update.
      let filter = Object.values(filters).find(
        fltr => fltr.name === suggestion.kind,
      )!;

      // We need a special-case to handle categories until we refactor the API to separate endpoints between
      // kinds of categories
      if (!filter) {
        // Pick the filter to update based on the payload's path: it contains the relevant filter's page path
        // (for eg. a meta-category or the "organizations" root page)
        filter = Object.values(filters).find(
          fltr =>
            !!fltr.base_path &&
            String(suggestion.id)
              .substr(2)
              .startsWith(fltr.base_path),
        )!;
      }

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

    /**
     * `react-autosuggest` callback to build up the list of suggestions and sections whenever user
     * interaction requires us to create or update that list.
     * @param value `value` as key to an anonymous object: the current value of the search suggest form field.
     */
    const onSuggestionsFetchRequested: SearchAutosuggestProps['onSuggestionsFetchRequested'] = async ({
      value: incomingValue,
    }) => {
      if (incomingValue.length < 3) {
        return setSuggestions([]);
      }

      // Fetch the suggestions for each resource-based section to build out the sections
      let sections: SearchSuggestionSection[];
      try {
        sections = (await Promise.all(
          Object.values(filters)
            .filter(filterdef => filterdef.is_autocompletable)
            .map(filterdef =>
              getSuggestionsSection(
                filterdef.name,
                filterdef.human_name,
                incomingValue,
              ),
            ),
          // We can assert this because of the catch below
        )) as SearchSuggestionSection[];
      } catch (error) {
        return handle(error);
      }

      setSuggestions(
        // Drop sections with no results as there's no use displaying them
        sections.filter(section => !!section!.values.length),
      );
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
        onSuggestionsFetchRequested={onSuggestionsFetchRequested}
        onSuggestionSelected={onSuggestionSelected}
        renderSectionTitle={section => section.title}
        renderSuggestion={renderSuggestion}
        shouldRenderSuggestions={val => val.length > 2}
        suggestions={suggestions as any}
      />
    );
  },
);
