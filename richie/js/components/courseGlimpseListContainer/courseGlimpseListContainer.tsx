import get from 'lodash-es/get';
import partial from 'lodash-es/partial';
import { connect, Dispatch } from 'react-redux';

import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { RootState } from '../../data/rootReducer';
import Course from '../../types/Course';
import { Maybe } from '../../utils/types';
import { CourseGlimpseList } from '../courseGlimpseList/courseGlimpseList';

export const mapStateToProps = (state: RootState) => {
  return {
    courses:
      // Get the relevant item indexes for the current query
      Object.keys(
        (state.resources.courses &&
          state.resources.courses.currentQuery &&
          state.resources.courses.currentQuery.items) ||
          [],
      )
        // Ensure preservation of order
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
        // Get the IDs matching the indexes in the current query
        .map(
          key =>
            state.resources.courses &&
            state.resources.courses.currentQuery &&
            state.resources.courses.currentQuery.items[key],
        )
        // Get the actual items matching those IDs
        // -1 will match nothing and get filtered right below
        .map(
          (id = -1) =>
            state.resources.courses && state.resources.courses.byId[id],
        )
        // Drop unknown indexes or broken keys so we don't pollute the UI
        .filter(item => !!item),
    currentParams:
      state.resources.courses &&
      state.resources.courses.currentQuery &&
      state.resources.courses.currentQuery.params,
  };
};

export const mergeProps = (
  {
    courses,
    currentParams,
  }: {
    courses: Array<Maybe<Course>>;
    currentParams: Maybe<ResourceListStateParams>;
  },
  { dispatch }: { dispatch: Dispatch<RootState> },
) => ({
  courses,
  requestCourses: () =>
    dispatch(
      getResourceList('courses', {
        ...(currentParams || {}),
        limit: 999,
      }),
    ),
});

export const CourseGlimpseListContainer = connect(
  mapStateToProps,
  null!,
  mergeProps,
)(CourseGlimpseList);

export default CourseGlimpseListContainer;
