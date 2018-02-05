import organizationReducer from './reducer';

describe('data/organization reducer', () => {
  const org43 = {
    banner: 'https://example.com/banner43.png',
    code: 'org-43',
    detail_page_enabled: false,
    id: 43,
    logo: 'https://example.com/logo43.png',
    name: 'Org 43',
  };

  const org44 = {
    banner: 'https://example.com/banner44.png',
    code: 'org-44',
    detail_page_enabled: false,
    id: 44,
    logo: 'https://example.com/logo44.png',
    name: 'Org 44',
  };

  it('returns an empty object for initialization', () => {
    expect(organizationReducer(undefined, undefined)).toEqual({});
  });

  it('returns the state as is when called with an unknown action', () => {
    const previousState = {
      byId: { '43': org43  },
    };
    expect(organizationReducer(previousState, { type: 'TODO_ADD' })).toEqual(previousState);
  });

  it('adds the organization to the state when called with ORGANIZATION_ADD', () => {
    const previousState = {
      byId: { '43': org43  },
    };
    expect(organizationReducer(previousState, {
      organization: org44,
      type: 'ORGANIZATION_ADD',
    })).toEqual({
      byId: {
        '43': org43,
        '44': org44,
      },
    });
  });
});
