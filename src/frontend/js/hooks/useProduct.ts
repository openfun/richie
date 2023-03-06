import { defineMessages } from 'react-intl';
import { Product } from 'api/joanie/gen';
import { joanieApi } from 'api/joanie';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { ResourcesQuery, useResource, UseResourcesProps } from 'hooks/useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useProduct.errorGet',
    description: 'Error message shown to the user when product fetch request fails.',
    defaultMessage: 'An error occurred while fetching product. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useProduct.errorNotFound',
    description: 'Error message shown to the user when no product matches.',
    defaultMessage: 'Cannot find the product.',
  },
});

interface UseProductReadQuery extends ResourcesQuery {
  course?: string;
}

/**
 * Joanie Api hook to retrieve a product through its id.
 */
const props: UseResourcesProps<Product> = {
  queryKey: ['products'],
  apiInterface: () => ({
    get: async (filters?: UseProductReadQuery) => {
      const { id, course } = filters || {};
      if (id) {
        return joanieApi.products.productsRead(id, course);
      }
      useJoanieApi().products.get(filters);
    },
  }),
  messages,
};

export const useProduct = useResource<Product>(props);
