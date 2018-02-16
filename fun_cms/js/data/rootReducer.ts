import { combineReducers, Reducer } from 'redux';

import { organization, OrganizationState } from './organization/reducer';
import { subject, SubjectState } from './subject/reducer';

export interface RootState {
  organization?: OrganizationState;
  subject?: SubjectState;
}

export const rootReducer: Reducer<RootState> = combineReducers({
  organization,
  subject,
});

export default rootReducer;
