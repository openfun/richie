import type { QueryKey } from '@tanstack/react-query';
import { useIntl } from 'react-intl';

/**
 * Append the current locale to the provided query key.
 * In this way, localized queries can be invalidated when language changes
 * @param queryKey
 */
const useLocalizedQueryKey = (queryKey: QueryKey): readonly unknown[] => {
  const { locale } = useIntl();

  return [...queryKey, locale];
};

export default useLocalizedQueryKey;
