import { useCallback, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { UseQueryOptions, useQueryClient } from '@tanstack/react-query';
import { AuthenticationApi } from 'api/authentication';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';
import { useSessionMutation } from 'utils/react-query/useSessionMutation';
import { OpenEdxFullNameFormValues } from 'components/OpenEdxFullNameForm';
import { HttpError } from 'utils/errors/HttpError';
import { TSessionQueryKey } from 'utils/react-query/useSessionKey';
import { OpenEdxProfile, parseOpenEdxApiProfile } from './utils';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useOpenEdxProfile.errorGet',
    description: 'Error message shown to the user when openEdx profile fetch request fails.',
    defaultMessage: 'An error occurred while fetching your profile. Please retry later.',
  },
  errorUpdate: {
    id: 'hooks.useOpenEdxProfile.errorUpdate',
    description:
      'Error message shown to the user when openEdx profile fullname post request fails.',
    defaultMessage: 'An error occurred while updating your full name. Please retry later.',
  },
});

interface UseOpenEdxProfileProps {
  username: string;
  onUpdateSuccess?: () => void;
}

const useOpenEdxProfile = (
  { username, onUpdateSuccess }: UseOpenEdxProfileProps,
  queryOptions?: Omit<
    UseQueryOptions<OpenEdxProfile, HttpError, OpenEdxProfile, TSessionQueryKey>,
    'queryKey' | 'queryFn'
  >,
) => {
  if (!AuthenticationApi) {
    throw new Error('AuthenticationApi is not defined');
  }

  if (!AuthenticationApi!.account) {
    throw new Error('Current AuthenticationApi does not support account request');
  }

  const intl = useIntl();
  const [error, setError] = useState<string>();
  const queryClient = useQueryClient();

  const invalidate = async () => {
    // Invalidate all queries related to the resource
    await queryClient.invalidateQueries({ queryKey: ['user', 'open-edx-profile'] });
    await queryClient.invalidateQueries({ queryKey: ['user'], exact: true });
  };

  const onSuccess = async () => {
    setError(undefined);
    await invalidate();
    onUpdateSuccess?.();
  };

  const queryFn: () => Promise<OpenEdxProfile> = useCallback(async () => {
    try {
      const openEdxApiProfile = await AuthenticationApi!.account!.get(username);
      return parseOpenEdxApiProfile(intl, openEdxApiProfile);
    } catch {
      setError(intl.formatMessage(messages.errorGet));
    }
    return Promise.reject();
  }, [username, AuthenticationApi]);

  const [readHandler] = useSessionQuery<OpenEdxProfile>(
    ['open-edx-profile'],
    queryFn,
    queryOptions,
  );

  const mutation = useSessionMutation;
  const writeHandlers = {
    update: mutation({
      mutationFn: (data: OpenEdxFullNameFormValues) =>
        AuthenticationApi!.account!.update(username, data),
      onSuccess,
      onError: () => setError(intl.formatMessage(messages.errorUpdate)),
    }),
  };

  return {
    data: readHandler.data,
    methods: {
      invalidate,
      refetch: readHandler.refetch,
      update: writeHandlers.update.mutate,
    },
    states: {
      isFetched: readHandler.isFetched,
      isPending: [...Object.values(writeHandlers), readHandler].some((value) => value?.isPending),
    },
    error,
  };
};

export default useOpenEdxProfile;
