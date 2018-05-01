import get from 'lodash-es/get';
import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { RootState } from '../../data/rootReducer';
import { CourseGlimpseList } from '../courseGlimpseList/courseGlimpseList';

export const mapStateToProps = (state: RootState) => {
  return {
    courses:
      // Get the relevant item indexes for the current query
      Object.keys(state.resources.courses &&
                  state.resources.courses.currentQuery &&
                  state.resources.courses.currentQuery.items || [])
      // Ensure preservation of order
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      // Get the IDs matching the indexes in the current query
      .map((key) => state.resources.courses &&
                    state.resources.courses.currentQuery &&
                    state.resources.courses.currentQuery.items[key])
      // Get the actual items matching those IDs
      // -1 will match nothing and get filtered right below
      .map((id = -1) => state.resources.courses &&
                        state.resources.courses.byId[id])
      // Drop unknown indexes or broken keys so we don't pollute the UI
      .filter((item) => !!item),
  };
};

const mapDispatchToProps = {
  requestCourses: partial(getResourceList, 'courses', { limit: 999 }),
};

export const CourseGlimpseListContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CourseGlimpseList);

export default CourseGlimpseListContainer;
