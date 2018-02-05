import { combineReducers, Reducer } from 'redux';

import { organization, organizationState } from './organization/reducer';
import { subject, subjectState } from './subject/reducer';

export type rootState = {
  organization?: organizationState;
  subject?: subjectState;
}

export const rootReducer: Reducer<rootState> = combineReducers({
  organization,
  subject,
});

export default rootReducer;
