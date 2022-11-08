import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import JoanieApiProvider from 'data/JoanieApiProvider';
import { useAddresses } from 'hooks/useAddresses';
import { useOrders } from 'hooks/useOrders';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import type { User } from 'types/User';
import type { Nullable } from 'types/utils';
import { AuthenticationApi } from 'utils/api/authentication';
import isTestEnv from 'utils/test/isTestEnv';
import usePrevious from 'utils/usePrevious';
import { useCreditCards } from 'hooks/useCreditCards';
import { Session } from './SessionContext';

/**
 * JoanieSessionProvider
 *
 * It retrieves the user then prefetches its orders, addresses and credit-cards.
 *
 * @param children - Elements to render inside SessionProvider
 *
 * @return {Object} Session
 * @return {Object} Session.user - authenticated user information
 * @return {Function} Session.login - redirect to the login page
 * @return {Function} Session.register - redirect to the register page
 * @return {Function} Session.destroy - set Session to undefined then make a request to logout user to the authentication service
 */
const JoanieSessionProvider = ({ children }: React.PropsWithChildren<any>) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const [refetchInterval, setRefetchInterval] = useState<false | number>(false);
  const {
    data: user,
    isStale,
    isLoading: isLoadingUser,
  } = useQuery<Nullable<User>>(['user'], AuthenticationApi!.me, {
    refetchOnWindowFocus: true,
    refetchInterval,
    staleTime: REACT_QUERY_SETTINGS.staleTimes.session,
    onError: () => {
      sessionStorage.removeItem(RICHIE_USER_TOKEN);
    },
    onSuccess: (data) => {
      sessionStorage.removeItem(RICHIE_USER_TOKEN);
      if (data) {
        sessionStorage.setItem(RICHIE_USER_TOKEN, data.access_token!);
      }
    },
  });
  const previousUserState = usePrevious(user);

  const queryClient = useQueryClient();
  const addresses = useAddresses();
  const creditCards = useCreditCards();
  const orders = useOrders();

  const login = useCallback(() => {
    queryClient.clear();
    sessionStorage.removeItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    sessionStorage.removeItem(RICHIE_USER_TOKEN);
    AuthenticationApi!.login();
  }, [queryClient]);

  const register = useCallback(() => {
    queryClient.clear();
    sessionStorage.removeItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    sessionStorage.removeItem(RICHIE_USER_TOKEN);
    AuthenticationApi!.register();
  }, [queryClient]);

  const invalidate = useCallback(() => {
    /*
      Invalidate all queries except 'user' as we can set it to null manually
      after logout to avoid extra requests
    */
    sessionStorage.removeItem(RICHIE_USER_TOKEN);
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

  useEffect(() => {
    if (user && !isStale) {
      addresses.methods.prefetch();
      creditCards.methods.prefetch();
      orders.methods.prefetch();
    }

    if (!isTestEnv) {
      // We do not want to enable refetchInterval during tests as it can pollute
      // the fetchMock when we use fake timers.
      if (user) {
        setRefetchInterval(REACT_QUERY_SETTINGS.staleTimes.session);
      } else {
        setRefetchInterval(false);
      }
    }
  }, [user]);

  const context = useMemo(
    () => ({
      user,
      isLoadingUser,
      destroy,
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

export default ({ children, ...props }: React.PropsWithChildren<any>) => (
  <JoanieApiProvider>
    <JoanieSessionProvider {...props}>{children}</JoanieSessionProvider>
  </JoanieApiProvider>
);
