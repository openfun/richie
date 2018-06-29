import { organizations } from './reducer';

describe('data/organizations reducer', () => {
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

  describe('resourceById', () => {
    it('drops actions that do not match the resourceName', () => {
      const previousState = { byId: { 43: org43 } };

      expect(
        organizations(previousState, {
          resource: org44,
          resourceName: 'subjects',
          type: 'RESOURCE_ADD',
        }),
      ).toEqual(previousState);
    });

    it('uses actions that match the resourceName', () => {
      const previousState = { byId: { 43: org43 } };

      expect(
        organizations(previousState, {
          resource: org44,
          resourceName: 'organizations',
          type: 'RESOURCE_ADD',
        }),
      ).toEqual({ byId: { 43: org43, 44: org44 } });
    });
  });
});
