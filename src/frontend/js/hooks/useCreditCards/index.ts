import { defineMessages, useIntl } from 'react-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MutateOptions } from '@tanstack/query-core';
import { API, CreditCard } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';
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
  errorCannotDelete: {
    id: 'hooks.useCreditCards.errorCannotDelete',
    description:
      'Error message shown to the user when trying to delete a credit card that is used to pay at least order.',
    defaultMessage:
      'Cannot delete the credit card •••• •••• •••• {last_numbers} because it is used to pay at least one of your order.',
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
  errorPromote: {
    id: 'hooks.useCreditCards.errorPromote',
    description: 'Error message shown to the user when promoting a credit card fails.',
    defaultMessage: 'Cannot set the credit card as default',
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
    const promoteHandler = mutation({
      mutationFn: api.promote,
      onSuccess: async () => {
        custom.methods.setError(undefined);
        custom.methods.invalidate();
        props.onMutationSuccess?.(queryClient);
      },
      onError: () => custom.methods.setError(intl.formatMessage(messages.errorPromote)),
    });

    /**
     * Override the default delete mutation to handle error more specifically.
     * If the error is a 409, it means the credit card is used to pay at least one order
     * and the user should be informed about that.
     */
    const deleteMutateAsync = async (creditCard: CreditCard, options?: MutateOptions) => {
      return custom.methods.delete(creditCard.id, {
        ...options,
        onError: (error: HttpError, variables, context) => {
          if (error.code === HttpStatusCode.CONFLICT) {
            custom.methods.setError(
              intl.formatMessage(messages.errorCannotDelete, {
                last_numbers: creditCard.last_numbers,
              }),
            );
          } else {
            custom.methods.setError(intl.formatMessage(messages.errorDelete));
          }
          options?.onError?.(error, variables, context);
        },
      });
    };

    return {
      ...custom,
      methods: {
        ...custom.methods,
        delete: deleteMutateAsync,
        tokenize: tokenizeHandler.mutateAsync,
        promote: promoteHandler.mutateAsync,
      },
      states: {
        ...custom.states,
        isPending: [tokenizeHandler, promoteHandler, custom.states].some(
          (value) => value?.isPending,
        ),
        updating: custom.states.updating || promoteHandler.isPending,
        tokenizing: tokenizeHandler.isPending,
        promoting: promoteHandler.isPending,
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
