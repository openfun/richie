import take from 'lodash-es/take';
import { stringify } from 'query-string';
import { FormattedMessage } from 'react-intl';

import { API_ENDPOINTS } from '../../settings';
import { CategoryForSuggestion } from '../../types/Category';
import { CourseForSuggestion } from '../../types/Course';
import { modelName } from '../../types/models';
import { OrganizationForSuggestion } from '../../types/Organization';
import { ResourceSuggestionSection } from '../../types/searchSuggest';
import { handle } from '../../utils/errors/handle';

/**
 * Build a suggestion section from a model name and a title, requesting the relevant
 * values to populate it from the API
 * @param sectionModel The model we're issuing the completion request on. Determines the API
 * endpoint we're sending the request to.
 * @param sectionTitleMessage MessageDescriptor for the title of the section that displays the suggestions.
 * @param query The actual payload to run the completion search with.
 */
export const getSuggestionsSection = async (
  sectionModel: ResourceSuggestionSection['model'],
  sectionTitleMessage: FormattedMessage.MessageDescriptor,
  query: string,
) => {
  // Run the search for the section on the API
  let response: Response;
  try {
    response = await fetch(
      `${API_ENDPOINTS.autocomplete[sectionModel]}?${stringify({ query })}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    return handle(new Error(error));
  }

  // Fetch treats remote errors (400, 404, 503...) as successes
  // The ok flag is the way to discriminate
  if (!response.ok) {
    return handle(
      new Error(
        `Failed to get list from ${
          API_ENDPOINTS.autocomplete[sectionModel]
        } : ${response.status}`,
      ),
    );
  }

  let data: Array<
    typeof sectionModel extends modelName.CATEGORIES
      ? CategoryForSuggestion
      : typeof sectionModel extends modelName.COURSES
      ? CourseForSuggestion
      : typeof sectionModel extends modelName.ORGANIZATIONS
      ? OrganizationForSuggestion
      : unknown
  >;
  try {
    data = await response.json();
  } catch (error) {
    return handle(
      new Error('Failed to decode JSON in getSuggestionSection ' + error),
    );
  }

  // Build out the section. Compiler needs help as it is unable to infer model name matches
  return {
    message: sectionTitleMessage,
    model: sectionModel,
    values: take(data, 3),
  };
};
