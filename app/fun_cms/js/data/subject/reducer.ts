import { Reducer } from 'redux';

import { SUBJECT_ADD } from './actions';
import Subject from '../../types/Subject';

const initialState = {};

export type subjectState = {
  byId?: {
    [id: string]: Subject;
  };
}

export const subject: Reducer<subjectState> = (state: subjectState = initialState, action: SUBJECT_ADD) => {
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
