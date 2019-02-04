import { modelName } from '../../../types/models';
import { byId } from './resourceById';

describe('data/genericReducers/resourceById reducer', () => {
  const cat43 = {
    id: 43,
    image: 'https://example.com/category_43.png',
    name: 'Category 43',
  };

  const cat44 = {
    id: 44,
    image: 'https://example.com/category_44.png',
    name: 'Category 44',
  };

  const cat45 = {
    id: 45,
    image: 'https://example.com/category_45.png',
    name: 'Category 45',
  };

  it('returns an empty state for initialization', () => {
    expect(byId({ byId: {} }, { type: '' })).toEqual({
      byId: {},
    });
  });

  it('returns the state as is when called with an unknown action', () => {
    const previousState = {
      byId: { 43: cat43 },
    };
    expect(byId(previousState, { type: '' })).toEqual(previousState);
  });

  describe('RESOURCE_ADD', () => {
    it('adds the category to the state when called with RESOURCE', () => {
      const previousState = {
        byId: { 43: cat43 },
      };
      expect(
        byId(previousState, {
          resource: cat44,
          resourceName: modelName.CATEGORIES,
          type: 'RESOURCE_ADD',
        }),
      ).toEqual({ byId: { 43: cat43, 44: cat44 } });
    });
  });

  describe('RESOURCE_MULTIPLE_ADD', () => {
    it('adds several categories at once', () => {
      const previousState = {
        byId: { 43: cat43 },
      };
      expect(
        byId(previousState, {
          resourceName: modelName.CATEGORIES,
          resources: [cat44, cat45],
          type: 'RESOURCE_MULTIPLE_ADD',
        }),
      ).toEqual({ byId: { 43: cat43, 44: cat44, 45: cat45 } });
    });
  });
});
