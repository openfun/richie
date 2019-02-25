import { computeNewFilterValue } from './computeNewFilterValue';

describe('utils/filters/computeNewFilterValue', () => {
  describe('add [drilldown]', () => {
    it('always returns the payload', () => {
      const update = {
        action: 'add' as 'add',
        isDrilldown: true,
        payload: 'new',
      };

      expect(computeNewFilterValue(undefined, update)).toEqual('new');
      expect(computeNewFilterValue('old', update)).toEqual('new');
      expect(computeNewFilterValue('42', update)).toEqual('new');
      expect(
        computeNewFilterValue(['old', 'slightly less old'], update),
      ).toEqual('new');
    });
  });

  describe('add [non drilldown]', () => {
    const update = { action: 'add' as 'add', isDrilldown: false };

    it('returns an array with the value when the existing value was undefined', () => {
      expect(
        computeNewFilterValue(undefined, { ...update, payload: '42' }),
      ).toEqual(['42']);
      expect(
        computeNewFilterValue(undefined, { ...update, payload: 'new_value' }),
      ).toEqual(['new_value']);
    });

    it('returns an array with the existing value and the new value when the existing value was a primitive', () => {
      expect(computeNewFilterValue('43', { ...update, payload: '86' })).toEqual(
        ['43', '86'],
      );
      expect(
        computeNewFilterValue('existing_value', {
          ...update,
          payload: 'incoming_value',
        }),
      ).toEqual(['existing_value', 'incoming_value']);
    });

    it('adds the new value at the end of the existing value if the existing value was an array', () => {
      expect(
        computeNewFilterValue(['44', '88'], { ...update, payload: '176' }),
      ).toEqual(['44', '88', '176']);
      expect(
        computeNewFilterValue(['val_A', 'val_B'], {
          ...update,
          payload: 'val_C',
        }),
      ).toEqual(['val_A', 'val_B', 'val_C']);
    });

    it('ignores the new value if it was already present as a primitive or in the list', () => {
      expect(computeNewFilterValue('43', { ...update, payload: '43' })).toEqual(
        ['43'],
      );
      expect(
        computeNewFilterValue(['44', '45', '46'], { ...update, payload: '45' }),
      ).toEqual(['44', '45', '46']);
    });
  });

  describe('remove [drilldown]', () => {
    const update = { action: 'remove' as 'remove', isDrilldown: true };

    it('returns undefined when the existing value was undefined', () => {
      expect(
        computeNewFilterValue(undefined, { ...update, payload: 'remove_me' }),
      ).toEqual(undefined);
      expect(
        computeNewFilterValue(undefined, { ...update, payload: '42' }),
      ).toEqual(undefined);
    });

    it('returns undefined when the existing value matches the payload to remove', () => {
      expect(
        computeNewFilterValue('remove_me', { ...update, payload: 'remove_me' }),
      ).toEqual(undefined);
      expect(computeNewFilterValue('42', { ...update, payload: '42' })).toEqual(
        undefined,
      );
    });
    it('returns the existing value when the payload does not match', () => {
      expect(
        computeNewFilterValue('do_not_remove_me', {
          ...update,
          payload: 'remove_me',
        }),
      ).toEqual('do_not_remove_me');
      expect(computeNewFilterValue('43', { ...update, payload: '42' })).toEqual(
        '43',
      );
    });
  });

  describe('remove [non drilldown]', () => {
    const update = { action: 'remove' as 'remove', isDrilldown: false };

    it('returns undefined when the existing value was undefined', () => {
      expect(
        computeNewFilterValue(undefined, { ...update, payload: '42' }),
      ).toEqual(undefined);
      expect(
        computeNewFilterValue(undefined, {
          ...update,
          payload: 'imaginary_value',
        }),
      ).toEqual(undefined);
    });

    it('returns undefined when the existing value was the passed value', () => {
      expect(computeNewFilterValue('42', { ...update, payload: '42' })).toEqual(
        undefined,
      );
      expect(
        computeNewFilterValue('existing_value', {
          ...update,
          payload: 'existing_value',
        }),
      ).toEqual(undefined);
    });

    it('returns the existing value when the existing value was not the passed value', () => {
      expect(computeNewFilterValue('42', { ...update, payload: '84' })).toEqual(
        '42',
      );
      expect(
        computeNewFilterValue('existing_value', {
          ...update,
          payload: 'imaginary_value',
        }),
      ).toEqual('existing_value');
    });

    it('removes the passed value from the existing value when the existing value was an array', () => {
      expect(
        computeNewFilterValue(['42', '84'], { ...update, payload: '42' }),
      ).toEqual(['84']);
      expect(
        computeNewFilterValue(['val_A', 'val_B'], {
          ...update,
          payload: 'val_B',
        }),
      ).toEqual(['val_A']);
    });

    it('returns undefined when the passed value was the only value in the existing value as an array', () => {
      expect(
        computeNewFilterValue(['43'], { ...update, payload: '43' }),
      ).toEqual(undefined);
      expect(
        computeNewFilterValue(['val_B'], { ...update, payload: 'val_B' }),
      ).toEqual(undefined);
    });
  });
});
