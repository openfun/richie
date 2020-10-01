import { Maybe } from 'utils/types';
/**
 * useCache
 * Little utils to retrieve/store information in session storage.
 *
 * @param key cacheKey to use
 *
 * @return [
 *  get: () => Maybe<data>,
 *  set: (value: any, lifetime: number = 5 minutes in ms) => void,
 *  clear: () => void
 * ]
 */

type CacheToolset = [() => Maybe<any>, (value: any, lifetime?: number) => void, () => void];
interface CacheEntry {
  value: any;
  expiredAt: number;
}

export const useCache = (key: string): CacheToolset => {
  const get = () => {
    const payload = sessionStorage.getItem(key);
    if (payload) {
      const data: CacheEntry = JSON.parse(atob(payload));

      if (data.expiredAt > Date.now()) return data.value;
      else clear();
    }
    return undefined;
  };

  const set = (value: any, lifetime: number = 5 * 60_000) => {
    const payload = btoa(JSON.stringify({ value, expiredAt: Date.now() + lifetime }));
    sessionStorage.setItem(key, payload);
  };

  const clear = () => sessionStorage.removeItem(key);

  return [get, set, clear];
};
