import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { MutateOptions, useQueryClient } from '@tanstack/react-query';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { REACT_QUERY_SETTINGS } from 'settings';
import { Address, AddressCreationPayload } from 'types/Joanie';
import { Maybe } from 'types/utils';
import { HttpError } from 'utils/errors/HttpError';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';

const messages = defineMessages({
  errorUpdate: {
    id: 'hooks.useAddresses.errorUpdate',
    description: 'Error message shown to the user when address update request fails.',
    defaultMessage: 'An error occurred while updating the address. Please retry later.',
  },
  errorDelete: {
    id: 'hooks.useAddresses.errorDelete',
    description: 'Error message shown to the user when address deletion request fails.',
    defaultMessage: 'An error occurred while deleting the address. Please retry later.',
  },
  errorCreate: {
    id: 'hooks.useAddresses.errorCreate',
    description: 'Error message shown to the user when address creation request fails.',
    defaultMessage: 'An error occurred while creating the address. Please retry later.',
  },
  errorSelect: {
    id: 'hooks.useAddresses.errorSelect',
    description: 'Error message shown to the user when addresses fetch request fails.',
    defaultMessage: 'An error occurred while fetching addresses. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useAddresses.errorNotFound',
    description: 'Error message shown to the user when not address matches.',
    defaultMessage: 'Cannot find the address',
  },
});

export type AddressesMutateOptions = MutateOptions<Address, HttpError, AddressCreationPayload>;

/**
 * Joanie Api hook to retrieve/create/update/delete addresses
 * owned by the authenticated user.
 */
export const useAddresses = (id?: string) => {
  const API = useJoanieApi();
  const queryClient = useQueryClient();
  const [error, setError] = useState<Maybe<string>>();
  const [data, setData] = useState<Address[]>([]);
  const intl = useIntl();

  const [readHandler, queryKey] = useSessionQuery(['addresses'], () => API.user.addresses.get(), {
    onError: () => setError(intl.formatMessage(messages.errorSelect)),
  });

  const prefetch = async () => {
    await queryClient.prefetchQuery(queryKey, () => API.user.addresses.get(), {
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
    const address = readHandler.data!.find((a) => a.id === id);
    if (!address) {
      setError(intl.formatMessage(messages.errorNotFound));
      setData([]);
      return;
    }
    setData([address!]);
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
    create: useSessionMutation(API.user.addresses.create, {
      onSuccess,
      onError: () => setError(intl.formatMessage(messages.errorCreate)),
    }),
    update: useSessionMutation(API.user.addresses.update, {
      onSuccess,
      onError: () => setError(intl.formatMessage(messages.errorUpdate)),
    }),
    delete: useSessionMutation(API.user.addresses.delete, {
      onSuccess,
      onError: () => setError(intl.formatMessage(messages.errorDelete)),
    }),
  };

  return {
    items: data || [],
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
