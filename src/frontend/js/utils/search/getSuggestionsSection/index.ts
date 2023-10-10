import take from 'lodash-es/take';
import queryString from 'query-string';

import { Suggestion } from 'types/Suggestion';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { handle } from 'utils/errors/handle';

/**
 * Build a suggestion section from a model name and a title, requesting the relevant
 * values to populate it from the API
 * @param kind The kind of suggestion we're issuing the completion request for. Determines the API
 * endpoint we're sending the request to.
 * @param sectionTitleMessage MessageDescriptor for the title of the section that displays the suggestions.
 * @param query The actual payload to run the completion search with.
 */
export const getSuggestionsSection = async (kind: string, title: string, query: string) => {
  // Run the search for the section on the API
  let response: Response;
  try {
    response = await fetch(`/api/v1.0/${kind}/autocomplete/?${queryString.stringify({ query })}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return handle(error);
  }

  // Fetch treats remote errors (400, 404, 503...) as successes
  // The ok flag is the way to discriminate
  if (!response.ok) {
    const error = new Error(`Failed to get list from ${kind} autocomplete : ${response.status}`);
    return response.status === HttpStatusCode.BAD_REQUEST
      ? handle(error, await response.json())
      : handle(error);
  }

  let responseData: Suggestion<string>[];
  try {
    responseData = await response.json();
  } catch (error) {
    return handle(new Error('Failed to decode JSON in getSuggestionSection ' + error));
  }

  return {
    kind,
    title,
    values: take(responseData, 3),
  };
};
