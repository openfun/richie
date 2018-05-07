import { Maybe, Nullable } from '../../utils/types';

// Compute a new value for a filter to apply to course search, reacting to a user interaction by
// either adding a new filter or removing one
export function computeNewFilterValue(
  action: 'add' | 'remove',
  existingValue: Maybe<Nullable<string | number | Array<string | number>>>,
  relevantValue: string | number,
) {
  // There is no existing value for this filter
  if (!existingValue) {
    return {
      // ADD: Make an array with the existing value
      add: () => [relevantValue],
      // REMOVE: There's nothing that could possibly removed, return null
      remove: () => null,
    }[action]();
  }

  // The existing value for this filter is a single primitive type value
  if (typeof existingValue === 'string' || typeof existingValue === 'number') {
    return {
      // ADD: Make an array with the existing value and the new one
      add: () => [existingValue, relevantValue],
      // REMOVE:
      // - Return nothing if we had to drop the existing value we had
      // - Keep the existing value if it's not the one we needed to drop
      remove: () => (existingValue === relevantValue ? null : existingValue),
    }[action]();
  }

  // The existing value is an array of strings or numbers (see function signature)
  return {
    // ADD: Just push the new value into our existing array of values
    add: () => [...(existingValue as Array<string | number>), relevantValue],
    // REMOVE: Return the existing array of values without the one we needed to remove
    remove: () =>
      nullEmptyArray(
        (existingValue as Array<string | number>).filter(
          v => v !== relevantValue,
        ),
      ),
  }[action]();

  function nullEmptyArray(array: Array<string | number>) {
    return array.length === 0 ? null : array;
  }
}

export default computeNewFilterValue;
