import { defineMessages, useIntl } from 'react-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API, CreditCard } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import {
  QueryOptions,
  ResourcesQuery,
  useResource,
  useResourcesCustom,
  UseResourcesProps,
} from '../useResources';

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
  errorTokenize: {
    id: 'hooks.useCreditCards.errorTokenize',
    description: 'Error message shown to the user when credit card tokenize request fails.',
    defaultMessage: 'An error occurred while adding a credit card. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useCreditCards.errorNotFound',
    description: 'Error message shown to the user when no credit cards matches.',
    defaultMessage: 'Cannot find the credit card',
  },
});

const useCreditCardResources =
  (props: UseResourcesProps<CreditCard, ResourcesQuery, API['user']['creditCards']>) =>
  (filters?: ResourcesQuery, queryOptions?: QueryOptions<CreditCard>) => {
    const custom = useResourcesCustom({ ...props, filters, queryOptions });
    const queryClient = useQueryClient();
    const intl = useIntl();
    const api = props.apiInterface();
    const mutation = (props.session ? useSessionMutation : useMutation) as typeof useMutation;
    const tokenizeHandler = mutation({
      mutationFn: api.tokenize,
      onSuccess: async () => {
        custom.methods.setError(undefined);
        props.onMutationSuccess?.(queryClient);
      },
      onError: () => custom.methods.setError(intl.formatMessage(messages.errorTokenize)),
    });

    return {
      ...custom,
      methods: {
        ...custom.methods,
        tokenize: tokenizeHandler.mutateAsync,
      },
      states: {
        ...custom.states,
        isPending: [tokenizeHandler, custom.states].some((value) => value?.isPending),
        tokenizing: tokenizeHandler.isPending,
      },
    };
  };

/**
 * Joanie Api hook to retrieve/create/update/delete credit cards
 * owned by the authenticated user.
 */
const props: UseResourcesProps<CreditCard, ResourcesQuery, API['user']['creditCards']> = {
  queryKey: ['creditCards'],
  apiInterface: () => useJoanieApi().user.creditCards,
  omniscient: true,
  session: true,
  messages,
};
export const useCreditCards = useCreditCardResources(props);
export const useCreditCard = useResource(props);
