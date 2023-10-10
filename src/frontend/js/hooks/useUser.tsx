import { defineMessages } from 'react-intl';
import { API } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { JoanieUserProfile } from 'types/User';
import { ResourcesQuery, useResource, UseResourcesProps } from './useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useUser.errorGet',
    description: 'Error message shown to the user when user fetch request fails.',
    defaultMessage: 'An error occurred while fetching logged user. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useUser.errorNotFound',
    description: "Error message shown to the user when it isn't logged.",
    defaultMessage: "You aren't log in.",
  },
});

const props: UseResourcesProps<JoanieUserProfile, ResourcesQuery, API['user']['me']> = {
  queryKey: ['user', 'joanie'],
  apiInterface: () => useJoanieApi().user.me,
  session: true,
  messages,
};
/**
 * Joanie Api hook to retrieve the authenticated user.
 */
export const useUser = useResource(props);
