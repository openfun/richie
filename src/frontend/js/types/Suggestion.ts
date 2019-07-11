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
 * Utility type that allows a consumer to easily define the kinds of suggestions it supports and
 * get proper typechecking around them.
 */
export type Suggestion<Kind extends string> = Kind extends 'default'
  ? DefaultSuggestion
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
  values: Array<Suggestion<'default'>>;
}

/**
 * Utility type that allows a consumer to easily define the kinds of suggestion sections it supports and
 * get proper typechecking around them.
 */
export type SuggestionSection<
  S extends Suggestion<string>
> = S extends DefaultSuggestion
  ? DefaultSuggestionSection
  : ResourceSuggestionSection<GenericSuggestion>;
