import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { QueryOptions, useResource, useResources, UseResourcesProps } from 'hooks/useResources';
import { API, Contract, ContractResourceQuery } from 'types/Joanie';

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

const props: UseResourcesProps<Contract, ContractResourceQuery, API['user']['contracts']> = {
  queryKey: ['contracts'],
  apiInterface: () => useJoanieApi().user.contracts,
  session: true,
  messages,
};

/**
 * Joanie Api hook to retrieve/update a contract owned by the authenticated user.
 */
export const useUserContract = useResource(props);
export const useUserContracts = useResources(props);

/**
 * Joanie Api hook to retrieve/update a contracts related to a course.
 */
const organizationProps: UseResourcesProps<
  Contract,
  ContractResourceQuery,
  API['organizations']['contracts']
> = {
  ...props,
  queryKey: ['organization_contracts'],
  apiInterface: () => useJoanieApi().organizations.contracts,
};

export const useOrganizationContract = (
  id: string,
  filters: ContractResourceQuery,
  queryOptions?: QueryOptions<Contract>,
) => {
  return useResource(organizationProps)(id, filters, {
    ...queryOptions,
    enabled:
      !!id &&
      !!filters?.organization_id &&
      (queryOptions?.enabled === undefined || queryOptions.enabled),
  });
};

export const useOrganizationContracts = (
  filters: ContractResourceQuery,
  queryOptions?: QueryOptions<Contract>,
) => {
  return useResources(organizationProps)(filters, {
    ...queryOptions,
    enabled:
      !!filters?.organization_id && (queryOptions?.enabled === undefined || queryOptions.enabled),
  });
};
