import subjectReducer from './reducer';

describe('data/subject reducer', () => {
  const subj43 = {
    code: 'subj-43',
    id: 43,
    name: 'Subject 43',
  };

  const subj44 = {
    code: 'subj-44',
    id: 44,
    name: 'Subject 44',
  };

  it('returns an empty object for initialization', () => {
    expect(subjectReducer(undefined, undefined)).toEqual({});
  });

  it('returns the state as is when called with an unknown action', () => {
    const previousState = {
      byId: { 43: subj43  },
    };
    expect(subjectReducer(previousState, { type: 'TODO_ADD' })).toEqual(previousState);
  });

  it('adds the subject to the state when called with SUBJECT_ADD', () => {
    const previousState = {
      byId: { 43: subj43  },
    };
    expect(subjectReducer(previousState, {
      subject: subj44,
      type: 'SUBJECT_ADD',
    })).toEqual({
      byId: {
        43: subj43,
        44: subj44,
      },
    });
  });
});
