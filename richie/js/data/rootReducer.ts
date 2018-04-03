import { combineReducers, Reducer } from 'redux';

import { course, CourseState } from './course/reducer';
import { organization, OrganizationState } from './organization/reducer';
import { subject, SubjectState } from './subject/reducer';

export interface RootState {
  course?: CourseState;
  organization?: OrganizationState;
  subject?: SubjectState;
}

export const rootReducer: Reducer<RootState> = combineReducers({
  course,
  organization,
  subject,
});

export default rootReducer;
