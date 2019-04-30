import { FormattedMessage } from 'react-intl';

import { CategoryForSuggestion } from './Category';
import { CourseForSuggestion } from './Course';
import { modelName } from './models';
import { OrganizationForSuggestion } from './Organization';

/**
 * A Default suggestion shape for cases where we need one.
 */
interface DefaultSuggestion {
  kind: 'default';
  title: string;
}

/**
 * A suggestion shape for Category autocomplete.
 */
interface CategorySuggestion {
  kind: modelName.CATEGORIES;
  data: CategoryForSuggestion;
}

/**
 * A suggestion shape for Course autocomplete.
 */
interface CourseSuggestion {
  kind: modelName.COURSES;
  data: CourseForSuggestion;
}

/**
 * A suggestion shape for Organization autocomplete.
 */
interface OrganizationSuggestion {
  kind: modelName.ORGANIZATIONS;
  data: OrganizationForSuggestion;
}

/**
 * Utility type that allows a consumer to easily define the kinds of suggestions it supports and
 * get proper typechecking around them.
 */
export type Suggestion<Kind> = Kind extends modelName.CATEGORIES
  ? CategorySuggestion
  : Kind extends modelName.COURSES
  ? CourseSuggestion
  : Kind extends modelName.ORGANIZATIONS
  ? OrganizationSuggestion
  : Kind extends 'default'
  ? DefaultSuggestion
  : never;

/**
 * The base shape of a resource suggestion section. Contains a bunch of suggestions and a title.
 * Used by our `react-autosuggest` callbacks to display, build & generally use our suggestions.
 * @kind A name such as a filter or model name for this kind of suggestion section.
 * @message A `react-intl` MessageDescriptor for the title of the section.
 * @values An array that contains all the Suggestion instances for this section.
 */
interface ResourceSuggestionSection<S extends Suggestion<modelName>> {
  kind: S['kind'];
  message: FormattedMessage.MessageDescriptor;
  values: S[];
}

/**
 * The default suggestion section. The only reason this is a section is we cannot put sections and
 * suggestions directly in the same autosuggest. We can instead make a section with only one suggestion and
 * no title to effectively get a suggestion.
 * @kind Always `'default'` for the default suggestion.
 * @message Always `null` for the default suggestion.
 * @value The default suggestion.
 */
interface DefaultSuggestionSection {
  kind: DefaultSuggestion['kind'];
  message: null;
  values: Array<Suggestion<'default'>>;
}

/**
 * Utility type that allows a consumer to easily define the kinds of suggestion sections it supports and
 * get proper typechecking around them.
 */
export type SuggestionSection<
  S extends Suggestion<modelName | 'default'>
> = S extends Suggestion<modelName.CATEGORIES>
  ? ResourceSuggestionSection<Suggestion<modelName.CATEGORIES>>
  : S extends Suggestion<modelName.COURSES>
  ? ResourceSuggestionSection<Suggestion<modelName.COURSES>>
  : S extends Suggestion<modelName.ORGANIZATIONS>
  ? ResourceSuggestionSection<Suggestion<modelName.ORGANIZATIONS>>
  : S extends DefaultSuggestion
  ? DefaultSuggestionSection
  : never;
