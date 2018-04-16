import { Reducer } from 'redux';

import { course, CourseState } from './course/reducer';
import { organization, OrganizationState } from './organization/reducer';
import { subject, SubjectState } from './subject/reducer';

export interface RootState {
  resources?: {
    course?: CourseState;
    organization?: OrganizationState;
    subject?: SubjectState;
  };
}

export const rootReducer: Reducer<RootState> = (state, action) => {
  return {
    resources: {
      course: course(state.resources && state.resources.course, action),
      organization: organization(state.resources && state.resources.organization, action),
      subject: subject(state.resources && state.resources.subject, action),
    },
  };
};

export default rootReducer;
