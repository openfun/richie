import { Maybe } from '../../utils/types';

// Compute a new value for a filter to apply to course search, reacting to a user interaction by
// either adding a new filter or removing one
export function computeNewFilterValue(
  existingValue: Maybe<string | string[]>,
  update: {
    action: 'add' | 'remove';
    isDrilldown: boolean;
    payload: string;
  },
) {
  if (update.isDrilldown) {
    return {
      // ADD: Drilldown filters only support one value at a time
      add: () => update.payload,
      // REMOVE:
      // - Drop the existing value if it matches the payload
      // - Keep it otherwise
      remove: () =>
        // Drilldown filters only support one value at a time
        existingValue === update.payload
          ? undefined
          : existingValue || undefined,
    }[update.action]();
  }

  // There is no existing value for this filter
  if (!existingValue) {
    return {
      // ADD: Make an array with the existing value
      add: () => [update.payload],
      // REMOVE: There's nothing that could possibly removed, return undefined
      remove: () => undefined,
    }[update.action]();
  }

  // The existing value for this filter is a single primitive type value
  if (typeof existingValue === 'string') {
    return {
      // ADD: Make an array with the existing value and the new one
      add: () =>
        existingValue === update.payload
          ? [existingValue]
          : [existingValue, update.payload],
      // REMOVE:
      // - Return nothing if we had to drop the existing value we had
      // - Keep the existing value if it's not the one we needed to drop
      remove: () =>
        existingValue === update.payload ? undefined : existingValue,
    }[update.action]();
  }

  // The existing value is an array of strings or numbers (see function signature)
  return {
    // ADD: Just push the new value into our existing array of values
    add: () =>
      existingValue.includes(update.payload)
        ? existingValue
        : [...existingValue, update.payload],
    // REMOVE: Return the existing array of values without the one we needed to remove
    remove: () =>
      dropEmptyArray(existingValue.filter(v => v !== update.payload)),
  }[update.action]();

  function dropEmptyArray(array: string[]) {
    return array.length === 0 ? undefined : array;
  }
}
