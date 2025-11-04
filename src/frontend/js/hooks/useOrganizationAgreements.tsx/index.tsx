import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { QueryOptions, useResource, useResources, UseResourcesProps } from 'hooks/useResources';
import { Agreement, API, ContractResourceQuery } from 'types/Joanie';

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

const props: UseResourcesProps<
  Agreement,
  ContractResourceQuery,
  API['organizations']['agreements']
> = {
  queryKey: ['organizationAgreements'],
  apiInterface: () => useJoanieApi().organizations.agreements,
  session: true,
  messages,
};

/**
 * Joanie Api hook to retrieve/update a contracts related to a course.
 */
const organizationProps: UseResourcesProps<
  Agreement,
  ContractResourceQuery,
  API['organizations']['agreements']
> = {
  ...props,
  queryKey: ['organizationAgreements'],
  apiInterface: () => useJoanieApi().organizations.agreements,
};

export const useOrganizationAgreement = (
  id: string,
  filters: ContractResourceQuery,
  queryOptions?: QueryOptions<Agreement>,
) => {
  return useResource(organizationProps)(id, filters, {
    ...queryOptions,
    enabled:
      !!id &&
      !!filters?.organization_id &&
      (queryOptions?.enabled === undefined || queryOptions.enabled),
  });
};

export const useOrganizationAgreements = (
  filters: ContractResourceQuery,
  queryOptions?: QueryOptions<Agreement>,
) => {
  return useResources(organizationProps)(filters, {
    ...queryOptions,
    enabled:
      !!filters?.organization_id && (queryOptions?.enabled === undefined || queryOptions.enabled),
  });
};
