import { AutosuggestProps } from 'react-autosuggest';

/**
 * A Default suggestion shape for cases where we need one.
 */
interface DefaultSuggestion {
  kind: 'default';
  title: string;
}

/**
 * A generic suggestion shape for autocomplete. Can be used for categories, organizations, persons, etc.
 */
interface GenericSuggestion {
  id: string;
  kind: string;
  title: string;
}

/**
 * Courses suggestions need their own type because they have the extra field `absolute_url`.
 */
interface CourseSuggestion extends GenericSuggestion {
  absolute_url: string;
  kind: 'courses';
}

/**
 * We also need a way to help TypeScript discriminate between CourseSuggestions and GenericSuggestions
 */
export function isCourseSuggestion(suggestion: Suggestion<string>): suggestion is CourseSuggestion {
  return suggestion.kind === 'courses';
}

/**
 * Utility type that allows a consumer to easily define the kinds of suggestions it supports and
 * get proper typechecking around them.
 */
export type Suggestion<Kind extends string> = Kind extends 'default'
  ? DefaultSuggestion
  : Kind extends 'courses'
    ? CourseSuggestion
    : GenericSuggestion;

/**
 * The base shape of a resource suggestion section. Contains a bunch of suggestions and a title.
 * Used by our `react-autosuggest` callbacks to display, build & generally use our suggestions.
 * @kind A name such as a filter or model name for this kind of suggestion section.
 * @title A translated string for the title of the section.
 * @values An array that contains all the Suggestion instances for this section.
 */
interface ResourceSuggestionSection<S extends Suggestion<string>> {
  kind: S['kind'];
  title: string;
  values: S[];
}

/**
 * The default suggestion section. The only reason this is a section is we cannot put sections and
 * suggestions directly in the same autosuggest. We can instead make a section with only one suggestion and
 * no title to effectively get a suggestion.
 * @kind Always `'default'` for the default suggestion.
 * @title Always `null` for the default suggestion.
 * @value The default suggestion.
 */
interface DefaultSuggestionSection {
  kind: DefaultSuggestion['kind'];
  title: null;
  values: Suggestion<'default'>[];
}

/**
 * Utility type that allows a consumer to easily define the kinds of suggestion sections it supports and
 * get proper typechecking around them.
 */
export type SuggestionSection<S extends Suggestion<string>> = S extends DefaultSuggestion
  ? DefaultSuggestionSection
  : ResourceSuggestionSection<GenericSuggestion>;

/**
 * Define the kind of suggestions our `<SearchSuggestField />` and `<RootSearchSuggestField />` components support.
 */
export type SearchSuggestion = Suggestion<'categories' | 'courses' | 'organizations' | 'persons'>;

/**
 * Derive from `SearchSuggestion` the kind of suggestion sections our `<SearchSuggestField />` and
 * `<RootSearchSuggestField />` components support
 */
export type SearchSuggestionSection = SuggestionSection<SearchSuggestion>;

/**
 * Helper to typecheck `react-autosuggest` expected props. Defines what is acceptable as a suggestion
 * throughout our code related to this instance of `<Autosuggest />`.
 */
export type SearchAutosuggestProps = AutosuggestProps<SearchSuggestion, SearchSuggestionSection>;
