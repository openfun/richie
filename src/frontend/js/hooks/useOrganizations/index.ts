import { defineMessages } from 'react-intl';

import { API, Organization, OrganizationResourceQuery } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useResource, useResources, UseResourcesProps } from '../useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useOrganizations.errorSelect',
    description: 'Error message shown to the user when organizations fetch request fails.',
    defaultMessage: 'An error occurred while fetching organizations. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useOrganizations.errorNotFound',
    description: 'Error message shown to the user when no organizations matches.',
    defaultMessage: 'Cannot find the organization',
  },
});

/**
 * Joanie Api hook to retrieve organizations
 * owned by the authenticated user.
 */
const props: UseResourcesProps<Organization, OrganizationResourceQuery, API['organizations']> = {
  queryKey: ['organizations'],
  apiInterface: () => useJoanieApi().organizations,
  session: true,
  messages,
};
export const useOrganizations = useResources<Organization, OrganizationResourceQuery>(props);
export const useOrganization = useResource<Organization, OrganizationResourceQuery>(props);
