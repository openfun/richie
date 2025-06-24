import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { API, Offering, OfferingQueryFilters } from 'types/Joanie';
import { useResource, useResources, UseResourcesProps } from 'hooks/useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useOfferings.errorGet',
    description: 'Error message shown to the user when offering fetch request fails.',
    defaultMessage: 'An error occurred while fetching trainings. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useOfferings.errorNotFound',
    description: 'Error message shown to the user when no offering matches.',
    defaultMessage: 'Cannot find the training.',
  },
});

/**
 * Joanie Api hook to retrieve/create/update/delete course
 * owned by the authenticated user.
 */
const props: UseResourcesProps<Offering, OfferingQueryFilters, API['offerings']> = {
  queryKey: ['offerings'],
  apiInterface: () => useJoanieApi().offerings,
  session: true,
  messages,
};

export const useOfferings = useResources<Offering, OfferingQueryFilters, API['offerings']>(props);

export const useOffering = useResource<Offering, OfferingQueryFilters>(props);
