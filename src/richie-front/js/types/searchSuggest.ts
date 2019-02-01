import { FormattedMessage } from 'react-intl';

import { Category } from './Category';
import { Course } from './Course';
import { modelName } from './models';
import { Organization } from './Organization';
import { Resource } from './Resource';

/**
 * The base shape of a search suggestion. Used by our `react-autosuggest` callbacks
 * to display, build & generally use our suggestions.
 * @model The (standard pluralized) name for the relevant model.
 * @data The model instance for this suggestion.
 */
interface ResourceSuggestionBase {
  model: modelName;
  data: Resource;
}

export interface CourseSuggestion extends ResourceSuggestionBase {
  model: modelName.COURSES;
  data: Course;
}
export interface OrganizationSuggestion extends ResourceSuggestionBase {
  model: modelName.ORGANIZATIONS;
  data: Organization;
}
export interface CategorySuggestion extends ResourceSuggestionBase {
  model: modelName.CATEGORIES;
  data: Category;
}

/**
 * Any search suggestion based on a resource eg. course, organization, category.
 */
export type ResourceSuggestion =
  | CourseSuggestion
  | OrganizationSuggestion
  | CategorySuggestion;

/**
 * The default search suggestion, eg. "Search for foo" based on the full text.
 * @model Always `null` for the default suggestion.
 * @data The current content of the search field.
 */
export interface DefaultSuggestion {
  model: null;
  data: string;
}

/**
 * Any search suggestion, whether resource based or the default one.
 */
export type SearchSuggestion = ResourceSuggestion | DefaultSuggestion;

/**
 * The base shape of a search suggestion section. Contains a bunch of suggestions and a title.
 * Used by our `react-autosuggest` callbacks to display, build & generally use our suggestions.
 * @message A `react-intl` MessageDescriptor for the title of the section
 * @model The (standard pluralized) name for the relevant model.
 * @values An array that contains all the Suggestion instances for this section.
 */
interface ResourceSuggestionSectionBase {
  message: FormattedMessage.MessageDescriptor;
  model: modelName;
  values: Resource[];
}

export interface CourseSuggestionSection extends ResourceSuggestionSectionBase {
  model: modelName.COURSES;
  values: Course[];
}
export interface OrganizationSuggestionSection
  extends ResourceSuggestionSectionBase {
  model: modelName.ORGANIZATIONS;
  values: Organization[];
}
export interface CategorySuggestionSection
  extends ResourceSuggestionSectionBase {
  model: modelName.CATEGORIES;
  values: Category[];
}

/**
 * Any search suggestion section based on a resource eg. course, organization, category.
 */
export type ResourceSuggestionSection =
  | CourseSuggestionSection
  | OrganizationSuggestionSection
  | CategorySuggestionSection;

/**
 * The default search suggestion section. The only reason this is a section is we cannot put sections and
 * suggestions directly in the same autosuggest. We can instead make a section with only one suggestion and
 * no title to effectively get a suggestion.
 * @message Always `null` for the default suggestion.
 * @model Always `null` for the default suggestion.
 * @value The default suggestion.
 */
export interface DefaultSuggestionSection {
  message: null;
  model: null;
  value: string;
}

/**
 * Any search suggestion section, whether resource based or the default one.
 */
export type SearchSuggestionSection =
  | ResourceSuggestionSection
  | DefaultSuggestionSection;
