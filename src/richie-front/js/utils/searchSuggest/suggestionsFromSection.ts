import {
  CourseSuggestion,
  CourseSuggestionSection,
  OrganizationSuggestion,
  OrganizationSuggestionSection,
  SearchSuggestion,
  SearchSuggestionSection,
  SubjectSuggestion,
  SubjectSuggestionSection,
} from '../../types/searchSuggest';

export function suggestionsFromSection(
  coursesSection: CourseSuggestionSection,
): CourseSuggestion[];
export function suggestionsFromSection(
  Organizationsection: OrganizationSuggestionSection,
): OrganizationSuggestion[];
export function suggestionsFromSection(
  SubjectsSection: SubjectSuggestionSection,
): SubjectSuggestion[];
export function suggestionsFromSection(
  section: SearchSuggestionSection,
): SearchSuggestion[] {
  // Compiler breaks down: it can't understand `T[] | U[]` is necessarily an array
  return (section.values as any[]).map(value => ({
    data: value,
    model: section.model,
    // Compiler breaks down: it merges SearchSuggestionSection 'model' as an intersection type
    // but does not do the same with SearchSuggestion model
  })) as any[];
}
