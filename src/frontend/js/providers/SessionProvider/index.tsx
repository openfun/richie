import { lazy, PropsWithChildren, Suspense, useContext } from 'react';
import { isJoanieEnabled } from 'api/joanie';
import { AuthenticationApi } from 'api/authentication';
import { handle } from 'utils/errors/handle';
import { Session } from './SessionContext';

const LazyBaseSessionProvider = lazy(() => import('./BaseSessionProvider'));
const LazyJoanieSessionProvider = lazy(() => import('./JoanieSessionProvider'));

/**
 * Lazily loads the right session provider according to Joanie activation.
 *
 * If `AuthenticationApi` is not setup, it returns children.
 * @param children
 * @param props
 */
export const SessionProvider = ({ children, ...props }: PropsWithChildren<any>) => {
  if (!AuthenticationApi) return children;

  return (
    <Suspense fallback="loading...">
      {isJoanieEnabled ? (
        <LazyJoanieSessionProvider {...props}>{children}</LazyJoanieSessionProvider>
      ) : (
        <LazyBaseSessionProvider {...props}>{children}</LazyBaseSessionProvider>
      )}
    </Suspense>
  );
};

/**
 * useSession
 *
 * It must be used within a `SessionProvider`.
 *
 * An utils to manage user session in Richie. This hook return a `SessionContext` which
 * allow accessing to authenticated user information and methods to login, register and
 * destroy a user session.
 *
 * useSession uses a context to dispatch any change to all react widgets.
 *
 * If `AuthenticationApi` is not set up, it raises an error then returns
 * the SessionContext with its default value to not break the execution stack.
 *
 */
export const useSession = () => {
  if (!AuthenticationApi) {
    handle(
      new Error(
        'You attempt to use `useSession` hook but there is no authentication backend configured.',
      ),
    );
  }
  return useContext(Session);
};
