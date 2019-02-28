import { parse, stringify } from 'query-string';
import { createContext, useEffect, useReducer } from 'react';

import { APIListRequestParams } from '../../types/api';
import { FilterDefinition } from '../../types/filters';
import { computeNewFilterValue } from '../../utils/filters/computeNewFilterValue';
import { history, location } from '../../utils/indirection/window';

interface FilterAction {
  filter: FilterDefinition;
  payload: string;
  type: 'FILTER_ADD' | 'FILTER_REMOVE';
}

interface QueryAction {
  query: string;
  type: 'QUERY_UPDATE';
}

export type CourseSearchParamsReducerAction = FilterAction | QueryAction;

type CourseSearchParamsState = [
  APIListRequestParams,
  React.Dispatch<CourseSearchParamsReducerAction>
];

export const CourseSearchParamsContext = createContext<CourseSearchParamsState>(
  [] as any,
);

const courseSearchParamsReducer = (
  courseSearchParams: APIListRequestParams,
  action: CourseSearchParamsReducerAction,
) => {
  switch (action.type) {
    case 'QUERY_UPDATE':
      return {
        ...courseSearchParams,
        // By replacing the empty string (the only falsy value we could receive for action.query) with `undefined`,
        // we keep a clean interface and ensure `stringify` removes `&query=` from the query string in history.
        query: action.query || undefined,
      };

    case 'FILTER_ADD':
    case 'FILTER_REMOVE':
      return {
        ...courseSearchParams,
        [action.filter.name]: computeNewFilterValue(
          courseSearchParams[action.filter.name],
          {
            action: (action.type === 'FILTER_ADD' && 'add') || 'remove',
            isDrilldown: !!action.filter.is_drilldown,
            payload: action.payload,
          },
        ),
      };
  }
};

export const useCourseSearchParams = (): CourseSearchParamsState => {
  const bootstrapParams = {
    limit: '999',
    offset: '0',
    ...(parse(location.search) as APIListRequestParams),
  };

  const [courseSearchParams, dispatch] = useReducer(
    courseSearchParamsReducer,
    bootstrapParams,
  );

  useEffect(() => {
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
