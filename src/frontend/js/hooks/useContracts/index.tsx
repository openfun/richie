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

/**
 * Joanie Api hook to retrieve/update a contracts related to a course.
 */
const courseProps: UseResourcesProps<Contract, ContractFilters, API['courses']['contracts']> = {
  ...props,
  queryKey: ['course_contracts'],
  apiInterface: () => useJoanieApi().courses.contracts,
};
export const useCourseContract = useResource(courseProps);
export const useCourseContracts = useResources(courseProps);

/**
 * Joanie Api hook to retrieve/update a contracts related to a course.
 */
const organizationProps: UseResourcesProps<
  Contract,
  ContractFilters,
  API['organizations']['contracts']
> = {
  ...props,
  queryKey: ['organization_contracts'],
  apiInterface: () => useJoanieApi().organizations.contracts,
};
export const useOrganizationContract = useResource(organizationProps);
export const useOrganizationContracts = useResources(organizationProps);
