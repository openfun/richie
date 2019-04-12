import { Maybe } from '../../utils/types';

// Compute a new value for a filter to apply to course search, reacting to a user interaction by
// either adding a new filter or removing one
export function computeNewFilterValue(
  existingValue: Maybe<string | string[]>,
  update: {
    action: 'FILTER_ADD' | 'FILTER_REMOVE';
    isDrilldown: boolean;
    payload: string;
  },
) {
  if (update.isDrilldown) {
    return {
      // ADD: Drilldown filters only support one value at a time
      FILTER_ADD: () => update.payload,
      // REMOVE:
      // - Drop the existing value if it matches the payload
      // - Keep it otherwise
      FILTER_REMOVE: () =>
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
      FILTER_ADD: () => [update.payload],
      // REMOVE: There's nothing that could possibly removed, return undefined
      FILTER_REMOVE: () => undefined,
    }[update.action]();
  }

  // The existing value for this filter is a single primitive type value
  if (typeof existingValue === 'string') {
    return {
      // ADD: Make an array with the existing value and the new one
      FILTER_ADD: () =>
        existingValue === update.payload
          ? [existingValue]
          : [existingValue, update.payload],
      // REMOVE:
      // - Return nothing if we had to drop the existing value we had
      // - Keep the existing value if it's not the one we needed to drop
      FILTER_REMOVE: () =>
        existingValue === update.payload ? undefined : existingValue,
    }[update.action]();
  }

  // The existing value is an array of strings or numbers (see function signature)
  return {
    // ADD: Just push the new value into our existing array of values
    FILTER_ADD: () =>
      existingValue.includes(update.payload)
        ? existingValue
        : [...existingValue, update.payload],
    // REMOVE: Return the existing array of values without the one we needed to remove
    FILTER_REMOVE: () =>
      dropEmptyArray(existingValue.filter(v => v !== update.payload)),
  }[update.action]();

  function dropEmptyArray(array: string[]) {
    return array.length === 0 ? undefined : array;
  }
}
