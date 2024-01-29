import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { useAddresses } from 'hooks/useAddresses';
import { useOmniscientOrders } from 'hooks/useOrders';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import type { User } from 'types/User';
import type { Nullable } from 'types/utils';
import { AuthenticationApi } from 'api/authentication';
import isTestEnv from 'utils/test/isTestEnv';
import usePrevious from 'hooks/usePrevious';
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
const JoanieSessionProvider = ({ children }: React.PropsWithChildren<{}>) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const [refetchInterval, setRefetchInterval] = useState<false | number>(false);
  const {
    data: user,
    isPending,
    isStale,
  } = useQuery<Nullable<User>>({
    queryKey: ['user'],
    queryFn: async () => {
      const userRes = await AuthenticationApi!.me();
      /**
       * It is on purpose that this side effect is done synchronously and not in a useEffect.
       * If we had wrapped it inside a useEffect it would cause race conditions where useSession
       * queries would turn enabled == true before the side effect is done and then try to use
       * the sessionStorage RICHIE_USER_TOKEN before it is set in fetchWithJWT. Thus causing 401 errors.
       */
      sessionStorage.setItem(RICHIE_USER_TOKEN, userRes?.access_token!);
      return userRes;
    },
    refetchOnWindowFocus: true,
    refetchInterval,
    staleTime: REACT_QUERY_SETTINGS.staleTimes.session,
  });
  const previousUserState = usePrevious(user);
  const queryClient = useQueryClient();
  const addresses = useAddresses();
  const creditCards = useCreditCards();
  const orders = useOmniscientOrders();

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

  const destroy = useCallback(async () => {
    await AuthenticationApi!.logout();
    sessionStorage.removeItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    sessionStorage.removeItem(RICHIE_USER_TOKEN);
    queryClient.removeQueries({
      predicate: (query: any) =>
        query.options.queryKey.includes('user') && query.options.queryKey.length > 1,
    });
    queryClient.setQueryData(['user'], null);
  }, []);

  useEffect(() => {
    if (user) {
      if (!isStale) {
        addresses.methods.prefetch();
        creditCards.methods.prefetch();
        orders.methods.prefetch();
      }
    } else {
      sessionStorage.removeItem(RICHIE_USER_TOKEN);
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
      isPending,
      destroy,
      login,
      register,
    }),
    [user, isPending, destroy, login, register],
  );

  useEffect(() => {
    // When user is updated, session queries should be invalidated.
    if (previousUserState !== user) {
      queryClient.invalidateQueries({
        predicate: (query: any) =>
          query.options.queryKey.includes('user') && query.options.queryKey.length > 1,
      });
    }
  }, [user]);

  return <Session.Provider value={context}>{children}</Session.Provider>;
};

export default ({ children }: React.PropsWithChildren<{}>) => (
  <JoanieApiProvider>
    <JoanieSessionProvider>{children}</JoanieSessionProvider>
  </JoanieApiProvider>
);
