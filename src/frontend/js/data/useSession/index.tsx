import React, { createContext, useCallback, useContext, PropsWithChildren } from 'react';
import { handle } from 'utils/errors/handle';
import { Maybe, Nullable } from 'types/utils';
import { User } from 'types/User';
import { AuthenticationApi } from 'utils/api/authentication';

import { useQuery, useQueryClient } from 'react-query';
import { REACT_QUERY_SETTINGS } from 'settings';

/**
 * useSession
 *
 * An utils to manage user session in Richie
 * User session information are extracted from OpenEdX cookies.
 * This means that OpenEdX and Richie must be accessible through the same domain and
 * OpenEdX must be configured to share cookies to Richie sub domain.
 *
 * "edxloggedin" cookie is used to know if an OpenEdX session is active or not,
 * then user information are extracted from "edx-user-info" cookie.
 *
 * useSession use a context to dispatch any change to all react widgets.
 *
 */

export interface SessionContext {
  destroy: () => void;
  login: () => void;
  register: () => void;
  user: Maybe<Nullable<User>>;
}

export const Session = createContext<SessionContext>({} as any);

/**
 * SessionProvider
 * @param children children to render inside SessionProvider
 *
 * Session:
 * @param user the current user state. Read below to see possible states
 * @param destroy set Session to undefined then make a request to logout user from OpenEdX
 */
export const SessionProvider = ({ children }: PropsWithChildren<any>) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const { data: user } = useQuery('user', AuthenticationApi!.me, {
    refetchOnWindowFocus: true,
    staleTime: REACT_QUERY_SETTINGS.staleTimes.session,
  });

  const queryClient = useQueryClient();

  const login = useCallback(() => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationAPI configured!'));

    queryClient.clear();
    AuthenticationApi!.login();
  }, [queryClient]);

  const register = useCallback(() => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationAPI configured!'));

    queryClient.clear();
    AuthenticationApi!.register();
  }, [queryClient]);

  const destroy = useCallback(async () => {
    if (!AuthenticationApi) return handle(new Error('No AuthenticationAPI configured!'));

    await AuthenticationApi!.logout();
    /*
      Invalidate all queries except 'user' as we can set it to null manually
      after logout to avoid extra requests
    */
    queryClient.invalidateQueries({ predicate: (query) => query.options.queryKey !== 'user' });
    queryClient.setQueryData('user', null);
  }, [queryClient]);

  return <Session.Provider value={{ user, destroy, login, register }}>{children}</Session.Provider>;
};

export const useSession = () => useContext(Session);
