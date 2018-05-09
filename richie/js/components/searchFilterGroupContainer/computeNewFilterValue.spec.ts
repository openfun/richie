import partial from 'lodash-es/partial';

import { computeNewFilterValue } from './computeNewFilterValue';

describe('components/searchFilterGroupContainer/computeNewFilterValue', () => {
  describe('add', () => {
    const addFilter = partial(computeNewFilterValue, 'add');

    it('returns an array with the value when the existing value was undefined', () => {
      expect(addFilter(undefined, 42)).toEqual([42]);
      expect(addFilter(undefined, 'new_value')).toEqual(['new_value']);
    });

    it('returns an array with the existing value and the new value when the existing value was a primitive', () => {
      expect(addFilter(43, 86)).toEqual([43, 86]);
      expect(addFilter('existing_value', 'incoming_value')).toEqual([
        'existing_value',
        'incoming_value',
      ]);
    });

    it('adds the new value at the end of the existing value if the existing value was an array', () => {
      expect(addFilter([44, 88], 176)).toEqual([44, 88, 176]);
      expect(addFilter(['val_A', 'val_B'], 'val_C')).toEqual([
        'val_A',
        'val_B',
        'val_C',
      ]);
    });
  });

  describe('remove', () => {
    const removeFilter = partial(computeNewFilterValue, 'remove');

    it('returns undefined when the existing value was undefined', () => {
      expect(removeFilter(undefined, 42)).toEqual(undefined);
      expect(removeFilter(undefined, 'imaginary_value')).toEqual(undefined);
    });

    it('returns undefined when the existing value was the passed value', () => {
      expect(removeFilter(42, 42)).toEqual(undefined);
      expect(removeFilter('existing_value', 'existing_value')).toEqual(
        undefined,
      );
    });

    it('returns the existing value when the existing value was not the passed value', () => {
      expect(removeFilter(42, 84)).toEqual(42);
      expect(removeFilter('existing_value', 'imaginary_value')).toEqual(
        'existing_value',
      );
    });

    it('removes the passed value from the existing value when the existing value was an array', () => {
      expect(removeFilter([42, 84], 42)).toEqual([84]);
      expect(removeFilter(['val_A', 'val_B'], 'val_B')).toEqual(['val_A']);
    });

    it('returns undefined when the passed value was the only value in the existing value as an array', () => {
      expect(removeFilter([43], 43)).toEqual(undefined);
      expect(removeFilter(['val_B'], 'val_B')).toEqual(undefined);
    });
  });
});
