import { useEffect } from 'react';

/**
 * Helper to allow calling `useEffect` with `async` functions.
 * `useEffect` cannot accept async functions as its argument as it relies on its return value (and does not
 * expect it to be a promise).
 * To still use `async` functions as effects, we can use a wrapper that will just delegate to the real
 * `useEffect hook`.
 * @param effect The async function that performs the effect.
 * @param dependencies The list of dependencies for this effect.
 */
export const useAsyncEffect = <T extends ReadonlyArray<any>>(
  effect: () => Promise<void | (() => void)>,
  dependencies?: T,
) => {
  return useEffect(() => {
    const cleanupPromise = effect();
    return () => {
      cleanupPromise.then((cleanup) => cleanup && cleanup());
    };
  }, dependencies);
};
