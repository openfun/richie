import type { QueryKey } from 'react-query';

export type TSessionQueryKey = ['user', ...(readonly unknown[])];

/**
 * A session query key is query key with 'user' as first item.
 * This hook prevents to append 'user' twice, if it already exists in the query key.
 * @param queryKey
 */
const useSessionQueryKey = (queryKey: QueryKey): TSessionQueryKey => {
  if (queryKey === 'user') {
    return [queryKey];
  } else if (Array.isArray(queryKey) && queryKey[0] === 'user') {
    return queryKey as TSessionQueryKey;
  }

  return ['user', ...(typeof queryKey === 'string' ? ([queryKey] as const) : queryKey)];
};

export default useSessionQueryKey;
