import { modelName } from '../../types/models';
import { organizations } from './reducer';

describe('data/organizations reducer', () => {
  const org43 = {
    detail_page_enabled: false,
    id: 43,
    logo: '/logo43.png',
    title: 'Org 43',
  };

  const org44 = {
    detail_page_enabled: false,
    id: 44,
    logo: '/logo44.png',
    title: 'Org 44',
  };

  describe('resourceById', () => {
    it('drops actions that do not match the resourceName', () => {
      const previousState = { byId: { 43: org43 } };

      expect(
        organizations(previousState, {
          resource: org44,
          resourceName: modelName.SUBJECTS,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual(previousState);
    });

    it('uses actions that match the resourceName', () => {
      const previousState = { byId: { 43: org43 } };

      expect(
        organizations(previousState, {
          resource: org44,
          resourceName: modelName.ORGANIZATIONS,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual({ byId: { 43: org43, 44: org44 } });
    });
  });
});
