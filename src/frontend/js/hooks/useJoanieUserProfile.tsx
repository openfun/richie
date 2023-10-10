import { defineMessages } from 'react-intl';
import { API } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { JoanieUserProfile } from 'types/User';
import { useSession } from 'contexts/SessionContext';
import { ResourcesQuery, useResource, UseResourcesProps } from './useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useJoanieUserProfile.errorGet',
    description: 'Error message shown to the user when user fetch request fails.',
    defaultMessage:
      'An error occurred while fetching user profile information. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useJoanieUserProfile.errorNotFound',
    description: "Error message shown to the user when it isn't logged.",
    defaultMessage: "You aren't logged in.",
  },
});

const props: UseResourcesProps<JoanieUserProfile, ResourcesQuery, API['user']['me']> = {
  queryKey: ['profile'],
  apiInterface: () => useJoanieApi().user.me,
  session: true,
  messages,
};
/**
 * Joanie Api hook to retrieve the authenticated user.
 */
export const useJoanieUserProfile = () => {
  const { user } = useSession();
  return useResource(props)(undefined, {}, { enabled: !!user });
};
