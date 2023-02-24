import { defineMessages } from 'react-intl';
import { joanieApi } from 'api/joanie';
import { Address } from 'api/joanie/gen';
import { ApiResourceInterface } from 'types/Joanie';
import { ResourcesQuery, useResource, useResources, UseResourcesProps } from './useResources';

const messages = defineMessages({
  errorUpdate: {
    id: 'hooks.useAddresses.errorUpdate',
    description: 'Error message shown to the user when address update request fails.',
    defaultMessage: 'An error occurred while updating the address. Please retry later.',
  },
  errorDelete: {
    id: 'hooks.useAddresses.errorDelete',
    description: 'Error message shown to the user when address deletion request fails.',
    defaultMessage: 'An error occurred while deleting the address. Please retry later.',
  },
  errorCreate: {
    id: 'hooks.useAddresses.errorCreate',
    description: 'Error message shown to the user when address creation request fails.',
    defaultMessage: 'An error occurred while creating the address. Please retry later.',
  },
  errorGet: {
    id: 'hooks.useAddresses.errorSelect',
    description: 'Error message shown to the user when addresses fetch request fails.',
    defaultMessage: 'An error occurred while fetching addresses. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useAddresses.errorNotFound',
    description: 'Error message shown to the user when not address matches.',
    defaultMessage: 'Cannot find the address',
  },
});

/**
 * Joanie Api hook to retrieve/create/update/delete addresses
 * owned by the authenticated user.
 */
const props: UseResourcesProps<Address, ResourcesQuery, ApiResourceInterface<Address>> = {
  queryKey: ['addresses'],
  apiInterface: () => ({
    get: async (filters?: ResourcesQuery) => {
      if (filters?.id) {
        return joanieApi.addresses.addressesRead(filters?.id);
      }
      return joanieApi.addresses.addressesList();
    },
    create: (data: Address) => joanieApi.addresses.addressesCreate(data),
    update: (data: Address) => {
      const { id, ...updatedData } = data;
      if (id) {
        return joanieApi.addresses.addressesUpdate(id, updatedData);
      }
      throw new Error('api.addressesUpdate need a id.');
    },
    delete: (id?: string) => {
      if (id) {
        return joanieApi.addresses.addressesDelete(id);
      }
      throw new Error('api.addressesDelete need a id.');
    },
  }),
  omniscient: true,
  session: true,
  messages,
};
export const useAddresses = useResources(props);
export const useAddress = useResource(props);
