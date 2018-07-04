import take from 'lodash-es/take';
import { stringify } from 'query-string';
import { FormattedMessage } from 'react-intl';

import { API_ENDPOINTS } from '../../settings';
import { Resource } from '../../types/Resource';
import { SearchSuggestionSection } from '../../types/searchSuggest';
import { handle } from '../../utils/errors/handle';

// Build a suggestion section from a model name and a title, requesting the relevant
// values to populate it from the API
export const getSuggestionsSection = async (
  sectionModel: SearchSuggestionSection['model'],
  sectionTitleMessage: FormattedMessage.MessageDescriptor,
  query: string,
) => {
  // Run the search for the section on the API
  let response: Response;
  try {
    response = await fetch(
      `${API_ENDPOINTS[sectionModel]}?${stringify({ query })}`,
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
        `Failed to get list from ${API_ENDPOINTS.courses} : ${response.status}`,
      ),
    );
  }

  let data: { objects: Resource[] };
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
    values: take(data.objects, 3),
  } as SearchSuggestionSection;
};
