import { useResource, UseResourcesProps } from 'hooks/useResources';
import { Product } from 'types/Joanie';
import { useJoanieApi } from 'data/JoanieApiProvider';

const props: UseResourcesProps<Product> = {
  queryKey: ['products'],
  apiInterface: () => useJoanieApi().user.products,
};

/**
 * Joanie Api hook to retrieve information of a product for the given id.
 * @param id
 */
export const useProduct = useResource(props);
