import { isMPTTChildOf, isMPTTParentOf } from 'utils/mptt';
import { Maybe } from 'types/utils';
import { CourseSearchParamsAction } from '.';

// Compute a new value for a filter to apply to course search, reacting to a user interaction by
// either adding a new filter or removing one
export const computeNewFilterValue = (
  existingValue: Maybe<string | string[]>,
  update: {
    action: CourseSearchParamsAction.filterAdd | CourseSearchParamsAction.filterRemove;
    isDrilldown: boolean;
    payload: string;
  },
) => {
  if (update.isDrilldown) {
    return {
      // ADD: Drilldown filters only support one value at a time
      [CourseSearchParamsAction.filterAdd]: () => update.payload,
      // REMOVE:
      // - Drop the existing value if it matches the payload
      // - Keep it otherwise
      [CourseSearchParamsAction.filterRemove]: () =>
        // Drilldown filters only support one value at a time
        existingValue === update.payload ? undefined : existingValue || undefined,
    }[update.action]();
  }

  // There is no existing value for this filter
  if (!existingValue) {
    return {
      // ADD: Make an array with the existing value
      [CourseSearchParamsAction.filterAdd]: () => [update.payload],
      // REMOVE: There's nothing that could possibly removed, return undefined
      [CourseSearchParamsAction.filterRemove]: () => undefined,
    }[update.action]();
  }

  // The existing value for this filter is a single primitive type value
  if (typeof existingValue === 'string') {
    return {
      // ADD
      // - Make an array with the existing value and the new one if they're different and unrelated
      // - Only keep the new value if the existing value is either its parent or its child
      // - Don't duplicate the value if the new value and existing one are the same
      [CourseSearchParamsAction.filterAdd]: () =>
        existingValue === update.payload
          ? [existingValue]
          : isMPTTParentOf(existingValue, update.payload) ||
              isMPTTChildOf(existingValue, update.payload)
            ? [update.payload]
            : [existingValue, update.payload],
      // REMOVE:
      // - Return nothing if we had to drop the existing value we had
      // - Keep the existing value if it's not the one we needed to drop
      [CourseSearchParamsAction.filterRemove]: () =>
        existingValue === update.payload ? undefined : existingValue,
    }[update.action]();
  }

  // The existing value is an array of strings or numbers (see function signature)
  return {
    // ADD: Just push the new value into our existing array of values
    [CourseSearchParamsAction.filterAdd]: () => [
      ...existingValue.filter(
        (value) =>
          value !== update.payload &&
          !isMPTTParentOf(value, update.payload) &&
          !isMPTTChildOf(value, update.payload),
      ),
      update.payload,
    ],
    // REMOVE: Return the existing array of values without the one we needed to remove
    [CourseSearchParamsAction.filterRemove]: () =>
      dropEmptyArray(existingValue.filter((v) => v !== update.payload)),
  }[update.action]();

  function dropEmptyArray(array: string[]) {
    return array.length === 0 ? undefined : array;
  }
};
