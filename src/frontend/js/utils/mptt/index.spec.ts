import { getMPTTChildrenPathMatcher, isMPTTParentOf } from '.';

describe('utils/mptt', () => {
  // NB: We're not testing isMPTTChildOf because it is logically the exact same function as `isMPTTParentOf`,
  // with the arguments reversed, and is implemented this way.
  describe('isMPTTParentOf()', () => {
    it('returns false when any of the args is not an MPTT path', () => {
      expect(isMPTTParentOf('en', 'fr')).toEqual(false);
      expect(isMPTTParentOf('L-000300010004', 'fr')).toEqual(false);
      expect(isMPTTParentOf('hello ther', 'P-000C00030009')).toEqual(false);
      expect(isMPTTParentOf('L-000', 'P-000C00030009')).toEqual(false);
    });

    it('returns false when both args are MPTT paths but x is not a parent of y', () => {
      expect(isMPTTParentOf('L-000300010004', 'P-000C00030009')).toEqual(false);
      expect(isMPTTParentOf('P-0003', 'L-000C0003')).toEqual(false);
      expect(isMPTTParentOf('P-00040001', 'L-00040002')).toEqual(false);
      expect(isMPTTParentOf('L-000200040003', 'P-00020004')).toEqual(false); // y is a parent of x
    });

    it('returns true when both args are MPTT paths and x is a parent of y', () => {
      expect(isMPTTParentOf('P-00020004', 'L-000200040003')).toEqual(true);
      expect(isMPTTParentOf('P-00020004', 'L-000200040003000C0009')).toEqual(true);
    });
  });

  describe('getMPTTChildrenPathMatcher()', () => {
    it('throws when the passed key is not an MPTT path', () => {
      expect(() => getMPTTChildrenPathMatcher('en')).toThrow();
      expect(() => getMPTTChildrenPathMatcher('L-000')).toThrow();
    });

    it('returns a regex-string that will match paths for children of the passed MPTT path entity', () => {
      expect(getMPTTChildrenPathMatcher('P-0001')).toEqual('.-0001.{4,}');
      expect(getMPTTChildrenPathMatcher('L-0001000C')).toEqual('.-0001000C.{4,}');
      expect(getMPTTChildrenPathMatcher('P-000100090006000C')).toEqual('.-000100090006000C.{4,}');
    });
  });
});
