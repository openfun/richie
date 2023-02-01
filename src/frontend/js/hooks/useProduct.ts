import { defineMessages } from 'react-intl';
import { Product } from 'types/Joanie';
import { useResource, UseResourcesProps } from 'hooks/useResources';
import { useJoanieApi } from 'data/JoanieApiProvider';

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

/**
 * Joanie Api hook to retrieve a product through its id.
 */
const props: UseResourcesProps<Product> = {
  queryKey: ['products'],
  apiInterface: () => useJoanieApi().products,
  messages,
};

export const useProduct = useResource<Product>(props);
