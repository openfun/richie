import { parse, stringify } from 'query-string';
import { useContext, useEffect } from 'react';

import { HistoryContext } from 'data/useHistory';
import { API_LIST_DEFAULT_PARAMS } from 'settings';
import { APIListRequestParams } from 'types/api';
import { FilterDefinition } from 'types/filters';
import { location, scroll } from 'utils/indirection/window';
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

type CourseSearchParamsState = {
  courseSearchParams: APIListRequestParams;
  dispatchCourseSearchParamsUpdate: (
    ...Actions: CourseSearchParamsReducerAction[]
  ) => void;
};

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
  // Grab HistoryContext so we can be kept updated when other parts of the component tree use pushState
  // to change the user search through the query string.
  const [historyEntry, pushState, replaceState] = useContext(HistoryContext);

  // HistoryEntry.state includes parse query strings, which if we're on a search page should be course search params
  const courseSearchParams: APIListRequestParams = historyEntry.state.data.params;

  // The dispatch + reducer pattern is useful to model changes in the course search params. However, we don't want
  // to duplicate behavior by having to sync the HistoryContext state with a `useReducer` call here.
  // We therefore build our own dispatch function that updates the shared value held by HistoryContext.
  const dispatch = (...actions: CourseSearchParamsReducerAction[]) => {
    // In some scenarios, we want to dispatch more than one action and only effect one actual history state change.
    // This is useful to eg. clean up the text query and add a filter the user selected through autosuggest.
    const newParams = actions.reduce(
      courseSearchParamsReducer,
      courseSearchParams,
    );
    // We should only update the history if the params have actually changed
    // We're using `stringify(parse(location.search))` as a way to reorder location search to the same order
    // `stringify` would output for our courseSearchParams. This allows us to avoid doing a deep comparison on
    // `courseSearchParams` and the result of `parse(location.search)`.
    // It also neatly treats eg. `organizations: '43'` and `organizations: ['43']` as the same.
    if (stringify(newParams) !== stringify(parse(location.search))) {
      pushState(
        {
          name: 'courseSearch',
          data: { params: newParams, lastDispatchActions: actions },
        },
        '',
        `${location.pathname}?${stringify(newParams)}`,
      );
    } else {
      // Just issue a replaceState call. This is useful as it means we'll push normalized params from
      // our reducer function.
      replaceState(
        {
          name: 'courseSearch',
          data: { params: newParams, lastDispatchActions: actions },
        },
        '',
        `${location.pathname}?${stringify(newParams)}`,
      );
    }
  };

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

    // The Search view & components operate with default params, and we don't want to have all other pages in Richie
    // bear the burden of setting them whenever they link to Search.
    // We can solve this problem by replacing the current history entry if it is lacking the default parameters. This
    // way all our components will re-render with the correct params immediately but we'll not break history for the
    // user.
    if (!courseSearchParams.limit || !courseSearchParams.offset) {
      const newParams = { ...API_LIST_DEFAULT_PARAMS, ...courseSearchParams };
      replaceState(
        {
          name: 'courseSearch',
          data: { params: newParams, lastDispatchActions: null },
        },
        '',
        `${location.pathname}?${stringify(newParams)}`,
      );
    }
  }, [courseSearchParams]);

  return {
    courseSearchParams,
    dispatchCourseSearchParamsUpdate: dispatch,
  };
};
