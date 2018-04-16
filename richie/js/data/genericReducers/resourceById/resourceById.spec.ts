import resourceByIdReducer from './resourceById';

describe('data/genericReducers/resourceById reducer', () => {
  const subj43 = {
    id: 43,
    image: 'https://example.com/subject_43.png',
    name: 'Subject 43',
  };

  const subj44 = {
    id: 44,
    image: 'https://example.com/subject_44.png',
    name: 'Subject 44',
  };

  it('returns an empty state for initialization', () => {
    expect(resourceByIdReducer(undefined, undefined)).toEqual({ byId: {} });
  });

  it('returns the state as is when called with an unknown action', () => {
    const previousState = {
      byId: { 43: subj43  },
    };
    expect(resourceByIdReducer(previousState, { type: '' })).toEqual(previousState);
  });

  it('adds the subject to the state when called with RESOURCE', () => {
    const previousState = {
      byId: { 43: subj43  },
    };
    expect(resourceByIdReducer(previousState, {
      resource: subj44,
      resourceName: 'subject',
      type: 'RESOURCE_ADD',
    })).toEqual({
      byId: {
        43: subj43,
        44: subj44,
      },
    });
  });
});
