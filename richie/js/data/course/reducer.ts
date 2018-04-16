import flow from 'lodash-es/flow';
import get from 'lodash-es/get';
import partialRight from 'lodash-es/partialRight';
import { Reducer } from 'redux';

import Course from '../../types/Course';
import { ResourceAdd } from '../genericReducers/resourceById/actions';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
} from '../genericReducers/resourceById/resourceById';
import { CourseListGetSuccess } from './actions';

const initialState = { ...resourceByIdInit };

export type CourseState = ResourceByIdState<Course> & {
  currentQuery?: {
    // A number-keyed object is more stable than an array to keep a list with a moving starting
    // index and potential gaps throughout.
    // NB: we still use string as the index type as keys of an objects are always converted to strings
    items: { [index: string]: Course['id'] };
    queryKey: string;
    total_count: number;
  };
};

const courseReducerExtension: Reducer<CourseState> = (
  state: CourseState = initialState,
  action?: ResourceAdd<Course> | CourseListGetSuccess | { type: '' },
) => {
  switch (action.type) {

    // Create or update the latest course list we fetched from the server
    case 'COURSE_LIST_GET_SUCCESS':
      const { objects, meta } = action.apiResponse;
      // Generate a generic representation of our query as a string with pagination params removed
      const { limit, offset = 0, ...cleanQuery } = action.params;
      const queryKey = JSON.stringify(cleanQuery);

      return {
        ...state,
        currentQuery: {
          items: objects.reduce(
            // Transform the array into an object with indexes as keys
            (acc, item, index) => ({ ...acc, [offset + index]: item.id }),
            // Extend the items list if we're receiving more items for the query we have in memory
            // (e.g. for pagination), replace it otherwise
            queryKey === get(state, 'currentQuery.queryKey') ? { ...state.currentQuery.items } : {},
          ),
          queryKey,
          total_count: meta.total_count,
        },
      };
  }
  return state;
};

export const course: Reducer<CourseState> = (
  state: CourseState = initialState,
  action?: ResourceAdd<Course> | CourseListGetSuccess | { type: '' },
) => {
  if (!action) { return state; } // Compiler needs help

  // Discriminate resource related actions by resource name
  if (get(action, 'resourceName') &&
      get(action, 'resourceName') !== 'course'
  ) {
    return state;
  }

  return flow([
    partialRight(byId, action),
    partialRight(courseReducerExtension, action),
  ])(state, action);
};

export default course;
