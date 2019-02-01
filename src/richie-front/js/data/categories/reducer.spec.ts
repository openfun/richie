import { modelName } from '../../types/models';
import { categories } from './reducer';

describe('data/categories reducer', () => {
  const cat43 = {
    id: 43,
    logo: '/category_43.png',
    title: 'Category 43',
  };

  const cat44 = {
    id: 44,
    logo: '/category_44.png',
    title: 'Category 44',
  };

  describe('resourceById', () => {
    it('drops actions that do not match the resourceName', () => {
      const previousState = { byId: { 43: cat43 } };

      expect(
        categories(previousState, {
          resource: cat44,
          resourceName: modelName.ORGANIZATIONS,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual(previousState);
    });

    it('uses actions that match the resourceName', () => {
      const previousState = { byId: { 43: cat43 } };

      expect(
        categories(previousState, {
          resource: cat44,
          resourceName: modelName.CATEGORIES,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual({ byId: { 43: cat43, 44: cat44 } });
    });
  });
});
