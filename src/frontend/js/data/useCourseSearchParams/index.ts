import { parse, stringify } from 'query-string';
import { createContext, useEffect, useReducer } from 'react';

import { API_LIST_DEFAULT_PARAMS } from 'settings';
import { APIListRequestParams } from 'types/api';
import { FilterDefinition } from 'types/filters';
import { history, location, scroll } from 'utils/indirection/window';
import { computeNewFilterValue } from './computeNewFilterValue';

interface FilterResetAction {
  type: 'FILTER_RESET';
}

interface FilterSingleAction {
  filter: FilterDefinition;
  payload: string;
  type: 'FILTER_ADD' | 'FILTER_REMOVE';
}

interface PageChangeAction {
  offset: string;
  type: 'PAGE_CHANGE';
}

interface QueryAction {
  query: string;
  type: 'QUERY_UPDATE';
}

export type CourseSearchParamsReducerAction =
  | FilterResetAction
  | FilterSingleAction
  | PageChangeAction
  | QueryAction;

type CourseSearchParamsState = [
  APIListRequestParams,
  React.Dispatch<CourseSearchParamsReducerAction>,
];

export const CourseSearchParamsContext = createContext<CourseSearchParamsState>(
  [] as any,
);

const courseSearchParamsReducer = (
  courseSearchParams: APIListRequestParams,
  action: CourseSearchParamsReducerAction,
) => {
  switch (action.type) {
    case 'PAGE_CHANGE':
      return {
        ...courseSearchParams,
        offset: action.offset,
      };

    case 'QUERY_UPDATE':
      return {
        ...courseSearchParams,
        // Go back to page 1 when the query changes
        offset: '0',
        // By replacing the empty string (the only falsy value we could receive for action.query) with `undefined`,
        // we keep a clean interface and ensure `stringify` removes `&query=` from the query string in history.
        query: action.query || undefined,
      };

    case 'FILTER_ADD':
    case 'FILTER_REMOVE':
      return {
        ...courseSearchParams,
        // Go back to page 1 when the query changes
        offset: '0',
        [action.filter.name]: computeNewFilterValue(
          courseSearchParams[action.filter.name],
          {
            action: action.type,
            isDrilldown: !!action.filter.is_drilldown,
            payload: action.payload,
          },
        ),
      };

    case 'FILTER_RESET':
      // Remove all parameters and reset pagination
      return {
        ...API_LIST_DEFAULT_PARAMS,
        limit: courseSearchParams.limit,
      };
  }
};

export const useCourseSearchParams = (): CourseSearchParamsState => {
  const bootstrapParams = {
    ...API_LIST_DEFAULT_PARAMS,
    ...(parse(location.search) as APIListRequestParams),
  };

  const [courseSearchParams, dispatch] = useReducer(
    courseSearchParamsReducer,
    bootstrapParams,
  );

  useEffect(() => {
    // We want to scroll back to the top only when pagination is updated. When the user clicks on a page number,
    // we can safely assume they are done interacting and want to move up top to see the new page.
    // When they're adding filters, we don't want to jankily force them to scroll again to where they were in
    // the page if they wanted to add more than one filter.
    // We're using `stringify(parse(location.search))` as a way to reorder location search to the same order
    // `stringify` would output for our courseSearchParams. This allows us to avoid doing a deep comparison on
    // `courseSearchParams` and the result of `parse(location.search)`.
    if (
      parse(location.search).offset !== courseSearchParams.offset &&
      stringify({
        ...courseSearchParams,
        offset: parse(location.search).offset,
      }) === stringify(parse(location.search))
    ) {
      scroll({
        behavior: 'smooth',
        top: 0,
      });
    }

    // We should only update the history if the params have actually changed
    // One such case is on load if we're just using query params from the URL
    // We're using `stringify(parse(location.search))` as a way to reorder location search to the same order
    // `stringify` would output for our courseSearchParams. This allows us to avoid doing a deep comparison on
    // `courseSearchParams` and the result of `parse(location.search)`.
    // It also neatly treats eg. `organizations: '43'` and `organizations: ['43']` as the same.
    if (stringify(courseSearchParams) !== stringify(parse(location.search))) {
      history.pushState(null, '', `?${stringify(courseSearchParams)}`);
    }
  }, [courseSearchParams]);

  return [courseSearchParams, dispatch];
};
