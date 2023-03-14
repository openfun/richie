import { PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthenticationApi } from 'api/authentication';
import { Nullable } from 'types/utils';
import { User } from 'types/User';
import { REACT_QUERY_SETTINGS } from 'settings';
import usePrevious from 'hooks/usePrevious';
import { Session } from './SessionContext';

/**
 * BaseSessionProvider
 *
 * @param children - Elements to render inside SessionProvider
 *
 * @return {Object} Session
 * @return {Object} Session.user - authenticated user information
 * @return {Function} Session.login - redirect to the login page
 * @return {Function} Session.register - redirect to the register page
 * @return {Function} Session.destroy - set Session to undefined then make a request to logout user to the authentication service
 */
const BaseSessionProvider = ({ children }: PropsWithChildren<any>) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const { data: user, isLoading: isLoadingUser } = useQuery<Nullable<User>>(
    ['user'],
    AuthenticationApi!.me,
    {
      refetchOnWindowFocus: true,
      staleTime: REACT_QUERY_SETTINGS.staleTimes.session,
    },
  );
  const previousUserState = usePrevious(user);

  const queryClient = useQueryClient();

  const login = useCallback(() => {
    queryClient.clear();
    sessionStorage.removeItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    AuthenticationApi!.login();
  }, [queryClient]);

  const register = useCallback(() => {
    queryClient.clear();
    sessionStorage.removeItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    AuthenticationApi!.register();
  }, [queryClient]);

  const invalidate = useCallback(() => {
    /*
      Invalidate all queries except 'user' as we can set it to null manually
      after logout to avoid extra requests
    */
    queryClient.removeQueries({
      predicate: (query: any) =>
        query.options.queryKey.includes('user') && query.options.queryKey.length > 1,
    });
    queryClient.setQueryData(['user'], null);
  }, [queryClient]);

  const destroy = useCallback(async () => {
    AuthenticationApi!.logout();
    invalidate();
  }, [invalidate]);

  const context = useMemo(
    () => ({
      user,
      isLoadingUser,
      destroy,
      invalidate,
      login,
      register,
    }),
    [user, isLoadingUser, destroy, login, register],
  );

  useEffect(() => {
    // When user is updated, session queries should be invalidated.
    if (previousUserState !== user) {
      queryClient.removeQueries({
        predicate: (query: any) =>
          query.options.queryKey.includes('user') && query.options.queryKey.length > 1,
      });
    }
  }, [user]);

  return <Session.Provider value={context}>{children}</Session.Provider>;
};

export default BaseSessionProvider;
