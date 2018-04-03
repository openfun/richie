import { Reducer } from 'redux';

import Course from '../../types/Course';
import { CourseAdd } from './actions';

const initialState = {};

export interface CourseState {
  byId?: {
    [id: string]: Course;
  };
}

export const course: Reducer<CourseState> = (
  state: CourseState = initialState,
  action?: CourseAdd,
) => {
  if (!action) { return state; } // Compiler needs help
  switch (action.type) {
    // Add a single course record to our state
    case 'COURSE_ADD':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.course.id]: action.course,
        },
      };
  }

  return state;
};

export default course;
