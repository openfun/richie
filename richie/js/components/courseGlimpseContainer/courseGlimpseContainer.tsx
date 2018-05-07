import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import Course from '../../types/Course';
import {
  CourseGlimpse,
  CourseGlimpseProps,
} from '../courseGlimpse/courseGlimpse';

export interface CourseGlimpseContainerProps {
  course: Course;
}

export const mapStateToProps = (
  state: RootState,
  ownProps: CourseGlimpseContainerProps,
) => {
  return {
    organization:
      (state.resources.organizations &&
        state.resources.organizations.byId[ownProps.course.organizations[0]]) ||
      null,
  };
};

export const mergeProps = (
  stateProps: Pick<CourseGlimpseProps, 'organization'>,
  dispatchProps: null,
  ownProps: CourseGlimpseContainerProps,
): CourseGlimpseProps => {
  const { organization, ...restState } = stateProps;
  const { course, ...restOwn } = ownProps;
  return { course, organization };
};

export const CourseGlimpseContainer = connect(
  mapStateToProps,
  null,
  mergeProps,
)(CourseGlimpse);

export default CourseGlimpseContainer;
