import { modelName } from '../../types/models';
import { ResourceSuggestion } from '../../types/searchSuggest';

export const suggestionHumanName = (suggestion: ResourceSuggestion) => {
  switch (suggestion.model) {
    case modelName.COURSES:
      const course = suggestion.data;
      return course.title;

    case modelName.ORGANIZATIONS:
      const organization = suggestion.data;
      return organization.name;

    case modelName.SUBJECTS:
      const subject = suggestion.data;
      return subject.name;
  }
};
