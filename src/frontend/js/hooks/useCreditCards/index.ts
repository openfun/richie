import { defineMessages } from 'react-intl';
import { CreditCard } from 'types/Joanie';

import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useResource, useResources, UseResourcesProps } from '../useResources';

const messages = defineMessages({
  errorUpdate: {
    id: 'hooks.useCreditCards.errorUpdate',
    description: 'Error message shown to the user when credit card update request fails.',
    defaultMessage: 'An error occurred while updating the credit card. Please retry later.',
  },
  errorGet: {
    id: 'hooks.useCreditCards.errorSelect',
    description: 'Error message shown to the user when credit cards fetch request fails.',
    defaultMessage: 'An error occurred while fetching credit cards. Please retry later.',
  },
  errorDelete: {
    id: 'hooks.useCreditCards.errorDelete',
    description: 'Error message shown to the user when credit card deletion request fails.',
    defaultMessage: 'An error occurred while deleting the credit card. Please retry later.',
  },
  errorCreate: {
    id: 'hooks.useCreditCards.errorCreate',
    description: 'Error message shown to the user when credit card creation request fails.',
    defaultMessage: 'An error occurred while creating the credit card. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useCreditCards.errorNotFound',
    description: 'Error message shown to the user when no credit cards matches.',
    defaultMessage: 'Cannot find the credit card',
  },
});

/**
 * Joanie Api hook to retrieve/create/update/delete credit cards
 * owned by the authenticated user.
 */
const props: UseResourcesProps<CreditCard> = {
  queryKey: ['creditCards'],
  apiInterface: () => useJoanieApi().user.creditCards,
  omniscient: true,
  session: true,
  messages,
};
export const useCreditCards = useResources<CreditCard>(props);
export const useCreditCard = useResource<CreditCard>(props);
