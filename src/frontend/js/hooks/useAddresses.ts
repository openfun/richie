import { defineMessages } from 'react-intl';
import { MutateOptions } from '@tanstack/react-query';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { Address, AddressCreationPayload, API } from 'types/Joanie';
import { HttpError } from 'utils/errors/HttpError';
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

export type AddressesMutateOptions = MutateOptions<Address, HttpError, AddressCreationPayload>;

/**
 * Joanie Api hook to retrieve/create/update/delete addresses
 * owned by the authenticated user.
 */
const props: UseResourcesProps<Address, ResourcesQuery, API['user']['addresses']> = {
  queryKey: ['addresses'],
  apiInterface: () => useJoanieApi().user.addresses,
  omniscient: true,
  session: true,
  messages,
};
export const useAddresses = useResources(props);
export const useAddress = useResource(props);
