import { useQueryClient } from 'react-query';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { REACT_QUERY_SETTINGS } from 'settings';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { Maybe } from 'types/utils';
import { CreditCard } from 'types/Joanie';

const messages = defineMessages({
  error: {
    id: 'hooks.useCreditCards.error',
    description:
      'Error message shown to the user when credit card creation/update/deletion request fails.',
    defaultMessage: 'An error occurred: {error}. Please retry later.',
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
 *
 */
export const useCreditCards = (id?: string) => {
  const API = useJoanieApi();
  const queryClient = useQueryClient();
  const [data, setData] = useState<CreditCard[]>([]);
  const [error, setError] = useState<Maybe<string>>();
  const intl = useIntl();

  const onError = (e: Error) => {
    setError(intl.formatMessage(messages.error, { error: e.message }));
  };

  const [readHandler, queryKey] = useSessionQuery(
    'credit-cards',
    () => API.user.creditCards.get(),
    {
      onError,
    },
  );

  const prefetch = async () => {
    await queryClient.prefetchQuery(queryKey, () => API.user.creditCards.get(), {
      staleTime: REACT_QUERY_SETTINGS.staleTimes.sessionItems,
    });
  };

  const filter = () => {
    if (!readHandler.data) {
      setData([]);
      return;
    }
    if (!id) {
      setData(readHandler.data);
      return;
    }
    const creditCard = readHandler.data!.find((a) => a.id === id);
    if (!creditCard) {
      setError(intl.formatMessage(messages.errorNotFound));
      setData([]);
      return;
    }
    setData([creditCard!]);
  };

  useEffect(() => {
    filter();
  }, [readHandler.data]);

  const invalidate = async () => {
    await queryClient.invalidateQueries(queryKey);
  };

  const onSuccess = async () => {
    setError(undefined);
    await invalidate();
  };

  const writeHandlers = {
    create: useSessionMutation(API.user.creditCards.create, {
      onSuccess,
      onError,
    }),
    update: useSessionMutation(API.user.creditCards.update, {
      onSuccess,
      onError,
    }),
    delete: useSessionMutation(API.user.creditCards.delete, {
      onSuccess,
      onError,
    }),
  };

  return {
    items: data,
    methods: {
      invalidate,
      prefetch,
      refetch: readHandler.refetch,
      create: writeHandlers.create.mutate,
      update: writeHandlers.update.mutate,
      delete: writeHandlers.delete.mutate,
      setError,
    },
    states: {
      fetching: readHandler.isLoading,
      creating: writeHandlers.create.isLoading,
      deleting: writeHandlers.delete.isLoading,
      updating: writeHandlers.update.isLoading,
      isLoading:
        Object.values(writeHandlers).reduce((previous, current) => {
          return previous || current.isLoading;
        }, false) || readHandler.isLoading,
      error,
    },
  };
};
