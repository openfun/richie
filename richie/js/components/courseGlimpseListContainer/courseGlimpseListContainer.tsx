import get from 'lodash-es/get';
import partial from 'lodash-es/partial';
import { connect } from 'react-redux';

import { getCourseList } from '../../data/course/actions';
import { RootState } from '../../data/rootReducer';
import { CourseGlimpseList } from '../courseGlimpseList/courseGlimpseList';

export const mapStateToProps = (state: RootState) => {
  return {
    courses:
      // Get the relevant item indexes for the current query
      Object.keys(state.resources &&
                  state.resources.course &&
                  state.resources.course.currentQuery &&
                  state.resources.course.currentQuery.items || [])
      // Ensure preservation of order
      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      // Get the IDs matching the indexes in the current query
      .map((key) => state.resources.course.currentQuery.items[key])
      // Get the actual items matching those IDs
      .map((id) => state.resources.course.byId[id]),
  };
};

const mapDispatchToProps = {
  requestCourses: partial(getCourseList, { limit: 999 }),
};

export const CourseGlimpseListContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(CourseGlimpseList);

export default CourseGlimpseListContainer;
