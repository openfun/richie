import subjectReducer from './reducer';

describe('data/subject reducer', () => {
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

  describe('resourceById', () => {
    it('drops actions that do not match the resourceName', () => {
      const previousState = { byId: { 43: subj43  } };

      expect(subjectReducer(previousState, {
        resource: subj44,
        resourceName: 'organization',
        type: 'RESOURCE_ADD',
      })).toEqual(previousState);
    });

    it('uses actions that match the resourceName', () => {
      const previousState = { byId: { 43: subj43  } };

      expect(subjectReducer(previousState, {
        resource: subj44,
        resourceName: 'subject',
        type: 'RESOURCE_ADD',
      })).toEqual({ byId: { 43: subj43, 44: subj44 } });
    });
  });
});
