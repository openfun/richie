import { Maybe } from 'types/utils';
import { base64Decode, base64Encode } from 'utils/base64Parser';
import { handle } from 'utils/errors/handle';
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
    try {
      const payload = sessionStorage.getItem(key);
      if (payload) {
        const data: CacheEntry = JSON.parse(base64Decode(payload));

        if (data.expiredAt > Date.now()) return data.value;
        else clear();
      }
      return undefined;
    } catch (error) {
      handle(error);
    }
  };

  const set = (value: any, lifetime: number = 5 * 60_000) => {
    try {
      const payload = base64Encode(JSON.stringify({ value, expiredAt: Date.now() + lifetime }));
      sessionStorage.setItem(key, payload);
    } catch (error) {
      handle(error);
    }
  };

  const clear = () => sessionStorage.removeItem(key);

  return [get, set, clear];
};
