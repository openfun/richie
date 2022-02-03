/**
 * Declare the Google Analytics ga function.
 */
import type { Maybe } from 'types/utils';

declare global {
  const ga: Maybe<
    (
      tracker: string,
      hitType: string,
      eventCategory: string,
      eventAction: string,
      eventLabel: string,
      eventValue?: any,
    ) => void
  >;
}
