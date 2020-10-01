import React, { createContext, useCallback, useContext, useState, PropsWithChildren } from 'react';
import { Maybe, Nullable } from 'utils/types';
import { User } from 'types/User';
import { AuthenticationApi } from 'utils/api/authentication';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { useCache } from 'utils/useCache';
import { SESSION_CACHE_KEY } from 'settings';
/**
 * useSession
 *
 * An utils to manage user session in Richie
 * User session information are extracted from EDX cookies.
 * This means that EDX and Richie must be accessible through the same domain and
 * EDX must be configured to share cookies to Richie sub domain.
 *
 * "edxloggedin" cookie is used to know if an EDX session is active or not,
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

const Session = createContext<SessionContext>({} as any);

/**
 * SessionProvider
 * @param children children to render inside SessionProvider
 *
 * Session:
 * @param user the current user state. Read below to see possible states
 * @param destroy set Session to undefined then make a request to logout user from EDX
 */
// TODO Store session in cache to not spam EDX API
export const SessionProvider = ({ children }: PropsWithChildren<any>) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const [getCachedSession, setCachedSession, clearCachedSession] = useCache(SESSION_CACHE_KEY);
  const [user, setState] = useState<Maybe<Nullable<User>>>();

  const setUser = useCallback(
    (nextUser: Maybe<Nullable<User>>) => {
      if (nextUser === undefined) clearCachedSession();
      else setCachedSession(nextUser);

      setState(nextUser);
    },
    [setState, setCachedSession],
  );

  const login = useCallback(() => {
    clearCachedSession();
    AuthenticationApi.login();
  }, [clearCachedSession, AuthenticationApi.login]);

  const register = useCallback(() => {
    clearCachedSession();
    AuthenticationApi.register();
  }, [clearCachedSession, AuthenticationApi.register]);

  const destroy = useCallback(async () => {
    setUser(undefined);
    await AuthenticationApi.logout();
    setUser(null);
  }, [setUser]);

  useAsyncEffect(async () => {
    const cachedUser = getCachedSession();
    if (cachedUser !== undefined) {
      setUser(cachedUser);
    } else {
      const me = await AuthenticationApi.me();
      setUser(me);
    }
  }, []);

  return <Session.Provider value={{ user, destroy, login, register }}>{children}</Session.Provider>;
};

export const useSession = () => useContext(Session);
