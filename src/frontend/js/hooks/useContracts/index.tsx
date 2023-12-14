import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useResource, useResources, UseResourcesProps } from 'hooks/useResources';
import { API, Contract, ContractFilters } from 'types/Joanie';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useContracts.errorSelect',
    description: 'Error message shown to the user when contracts fetch request fails.',
    defaultMessage: 'An error occurred while fetching contracts. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useContracts.errorNotFound',
    description: 'Error message shown to the user when no contract matches.',
    defaultMessage: 'Cannot find the contract',
  },
});

const props: UseResourcesProps<Contract, ContractFilters, API['user']['contracts']> = {
  queryKey: ['contracts'],
  apiInterface: () => useJoanieApi().user.contracts,
  session: true,
  messages,
};
/**
 * Joanie Api hook to retrieve/update a contract owned by the authenticated user.
 */
export const useContract = useResource(props);
export const useContracts = useResources(props);
