import { ResourceSuggestion } from '../../types/searchSuggest';

export const suggestionHumanName = (suggestion: ResourceSuggestion) => {
  switch (suggestion.model) {
    case 'courses':
      const course = suggestion.data;
      return course.title;

    case 'organizations':
      const organization = suggestion.data;
      return organization.name;

    case 'subjects':
      const subject = suggestion.data;
      return subject.name;
  }
};
