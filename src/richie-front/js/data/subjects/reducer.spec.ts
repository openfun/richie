import { modelName } from '../../types/models';
import { subjects } from './reducer';

describe('data/subjects reducer', () => {
  const subj43 = {
    id: 43,
    logo: '/subject_43.png',
    title: 'Subject 43',
  };

  const subj44 = {
    id: 44,
    logo: '/subject_44.png',
    title: 'Subject 44',
  };

  describe('resourceById', () => {
    it('drops actions that do not match the resourceName', () => {
      const previousState = { byId: { 43: subj43 } };

      expect(
        subjects(previousState, {
          resource: subj44,
          resourceName: modelName.ORGANIZATIONS,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual(previousState);
    });

    it('uses actions that match the resourceName', () => {
      const previousState = { byId: { 43: subj43 } };

      expect(
        subjects(previousState, {
          resource: subj44,
          resourceName: modelName.SUBJECTS,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual({ byId: { 43: subj43, 44: subj44 } });
    });
  });
});
