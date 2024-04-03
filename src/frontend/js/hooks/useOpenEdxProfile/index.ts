import { useCallback, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { AuthenticationApi } from 'api/authentication';
import { useSessionQuery } from 'utils/react-query/useSessionQuery';
import { OpenEdxProfile, parseOpenEdxApiProfile } from './utils';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useOpenEdxProfile.errorGet',
    description: 'Error message shown to the user when openEdx profile fetch request fails.',
    defaultMessage: 'An error occurred while fetching your profile. Please retry later.',
  },
});

interface UseOpenEdxProfileProps {
  username: string;
}

const useOpenEdxProfile = ({ username }: UseOpenEdxProfileProps) => {
  if (!AuthenticationApi) {
    throw new Error('AuthenticationApi is not defined');
  }

  if (!AuthenticationApi!.account) {
    throw new Error('Current AuthenticationApi does not support account request');
  }

  const intl = useIntl();
  const [error, setError] = useState<string>();

  const queryFn: () => Promise<OpenEdxProfile> = useCallback(async () => {
    try {
      const openEdxApiProfile = await AuthenticationApi!.account!.get(username);
      return parseOpenEdxApiProfile(intl, openEdxApiProfile);
    } catch {
      setError(intl.formatMessage(messages.errorGet));
    }
    return Promise.reject();
  }, [username, AuthenticationApi]);

  const [queryHandler] = useSessionQuery<OpenEdxProfile>(['open-edx-profile'], queryFn);
  return { data: queryHandler.data, error };
};

export default useOpenEdxProfile;
