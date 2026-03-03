import { useQuery } from '@tanstack/react-query';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { OfferingDeepLink } from 'types/Joanie';
import { HttpError } from 'utils/errors/HttpError';

type DeepLinkFilters = {
  course_code: string;
  product_id: string;
};

export const useDeepLink = (filters: DeepLinkFilters) => {
  const api = useJoanieApi();
  return useQuery<OfferingDeepLink, HttpError>({
    queryKey: ['courses-products', ...Object.values(filters), 'deep-link'],
    queryFn: () =>
      api.courses.products.deepLink.get({
        id: filters.product_id,
        course_id: filters.course_code,
      }),
  });
};
