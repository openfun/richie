import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { API, Offer, OfferQueryFilters } from 'types/Joanie';
import { useResource, useResources, UseResourcesProps } from 'hooks/useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useOffers.errorGet',
    description: 'Error message shown to the user when offer fetch request fails.',
    defaultMessage: 'An error occurred while fetching trainings. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useOffers.errorNotFound',
    description: 'Error message shown to the user when no offer matches.',
    defaultMessage: 'Cannot find the training.',
  },
});

/**
 * Joanie Api hook to retrieve/create/update/delete course
 * owned by the authenticated user.
 */
const props: UseResourcesProps<Offer, OfferQueryFilters, API['offers']> = {
  queryKey: ['offers'],
  apiInterface: () => useJoanieApi().offers,
  session: true,
  messages,
};

export const useOffers = useResources<Offer, OfferQueryFilters, API['offers']>(props);

export const useOffer = useResource<Offer, OfferQueryFilters>(props);
