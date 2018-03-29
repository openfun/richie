import { Reducer } from 'redux';

import Subject from '../../types/Subject';
import { SubjectAdd } from './actions';

const initialState = {};

export interface SubjectState {
  byId?: {
    [id: string]: Subject;
  };
}

export const subject: Reducer<SubjectState> = (state: SubjectState = initialState, action: SubjectAdd) => {
  switch (action && action.type) {
    case 'SUBJECT_ADD':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.subject.id]: action.subject,
        },
      };
  }

  return state;
};

export default subject;
