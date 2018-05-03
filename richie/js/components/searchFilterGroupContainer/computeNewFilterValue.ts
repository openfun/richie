import { Maybe, Nullable } from '../../utils/types';

// Compute a new value for a filter to apply to course search, reacting to a user interaction by
// either adding a new filter or removing one
export function computeNewFilterValue(
  action: 'add' | 'remove',
  existingValue: Maybe<Nullable<string | number | Array<string | number>>>,
  relevantValue: string | number,
) {
  if (!existingValue) {
    // There is no existing value for this filter
    return action === 'add' ?
      // ADD: Make an array with the existing value
      [ relevantValue ] :
      // REMOVE: There's nothing that could possibly removed, return null
      null;
  } else if (typeof existingValue === 'string' || typeof existingValue === 'number') {
    // The existing value for this filter is a single primitive type value
    return action === 'add' ?
      // ADD: Make an array with the existing value and the new one
      [ existingValue, relevantValue ] :
      (existingValue === relevantValue ?
        // REMOVE: Return nothing if we had to drop the existing value we had
        null :
        // REMOVE: Keep the existing value if it's not the one we needed to drop
        existingValue);
  } else {
    // The existing value is an array of strings or numbers
    const nullEmptyArray = (array: Array<string | number>) => {
      return array.length === 0 ? null : array;
    };

    return action === 'add' ?
      // ADD: Just push the new value into our existing array of values
      [ ...existingValue, relevantValue ] :
      // REMOVE: Return the existing array of values without the one we needed to remove
      nullEmptyArray(existingValue.filter((v) => v !== relevantValue));
  }
}

export default computeNewFilterValue;
