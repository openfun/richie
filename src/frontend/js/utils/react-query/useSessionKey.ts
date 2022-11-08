import type { QueryKey } from '@tanstack/react-query';

export type TSessionQueryKey = ['user', ...(readonly unknown[])];

/**
 * A session query key is query key with 'user' as first item.
 * This hook prevents to append 'user' twice, if it already exists in the query key.
 * @param queryKey
 */
const useSessionQueryKey = (queryKey: QueryKey): TSessionQueryKey => {
  return queryKey[0] === 'user' ? (queryKey as TSessionQueryKey) : ['user', ...queryKey];
};

export default useSessionQueryKey;
