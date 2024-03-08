import { defineMessages } from 'react-intl';
import { MutateOptions } from '@tanstack/react-query';
import { getApiClientJoanie } from 'api/joanie/client';
import type { Address, AddressRequest } from 'api/joanie/gen';
import { PatchedAddressRequest } from 'api/joanie/gen';
import { ApiResourceInterface, PaginatedResourceQuery } from 'types/Joanie';
import { Maybe } from 'types/utils';
import { HttpError } from 'utils/errors/HttpError';

import { useResource, useResources, UseResourcesProps } from './useResources';

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

export type AddressesMutateOptions = MutateOptions<PatchedAddressRequest, HttpError, Address>;

const apiInterface: () => ApiResourceInterface<Address, PaginatedResourceQuery> = () => {
  const joanieClient = getApiClientJoanie();
  return {
    get: (resourceQuery?: Maybe<PaginatedResourceQuery>) => {
      const { id, ...filters } = resourceQuery || {};
      if (id) {
        return joanieClient.addresses.addressesRetrieve(id);
      }
      return joanieClient.addresses.addressesList(filters.page, filters.page_size);
    },
    create: (data: AddressRequest) => {
      return joanieClient.addresses.addressesCreate(data);
    },
    update: (data: AddressRequest & { id: string }) => {
      const { id, ...updateData } = data;
      return joanieClient.addresses.addressesUpdate(id, updateData);
    },
    delete: (id: string) => {
      return joanieClient.addresses.addressesDestroy(id);
    },
  };
};

/**
 * Joanie Api hook to retrieve/create/update/delete addresses
 * owned by the authenticated user.
 */
const props: UseResourcesProps<Address, PaginatedResourceQuery, ReturnType<typeof apiInterface>> = {
  queryKey: ['addresses'],
  apiInterface,
  omniscient: true,
  session: true,
  messages,
};
export const useAddresses = useResources(props);
export const useAddress = useResource(props);
