import React, { createContext, PropsWithChildren, useCallback, useContext, useState } from 'react';
import { a2b, b2a } from 'utils/base64UnicodeParser';
import { User } from 'types/User';
import { Maybe, Nullable } from 'utils/types';

/**
 * SessionContext
 *
 * Store front user information in SessionStorage in order to keep this information in frontend
 * to avoid too much requests to /whoami endpoints for example.
 * It provides methods to update and destroy session when needed (e.g: on logout, login...)
 * See <UserLogin /> to read a use case.
 *
 * User stored in session can have three types:
 *  - undefined when no session exists or session expired
 *  - null      when the user is not authenticated on Richie
 *  - User      when the user is authenticated on Richie
 *
 * @return [
 *  user current user state in session,
 *  setUser method to update user state in session,
 *  destroySession fully destroy the session from SessionStorage,
 * ]
 *
 */

// Types
interface Session {
  expiredAt?: Number;
  user: Maybe<Nullable<User>>;
}

type SetUser = (user: Nullable<User>) => void;
type DestroySession = () => void;
type UserSession = [Session['user'], SetUser, DestroySession];

// Constants
const LOCAL_SESSION_LIFETIME = 30 * 60 * 1000; // 30 minutes in ms
const SESSION_KEY = 'user_session';

// Utils
function deserializeSession(rawSession: string): Session {
  return JSON.parse(a2b(rawSession));
}

export function serializeSession(session: Session): string {
  return b2a(JSON.stringify(session));
}

function hydrateSession() {
  if (sessionStorage.hasOwnProperty(SESSION_KEY)) {
    const rawSession = sessionStorage.getItem(SESSION_KEY) || '';
    const session = deserializeSession(rawSession);
    if (session.expiredAt && session.expiredAt > Date.now()) {
      return session;
    }
  }

  return { user: undefined };
}

// Core
const SessionContext = createContext<UserSession>([] as any);

export const SessionProvider = ({ children }: PropsWithChildren<{}>) => {
  const [session, setSession] = useState(hydrateSession);

  const setUser = useCallback(
    (user: Session['user']) => {
      const nextSession = {
        expiredAt: Date.now() + LOCAL_SESSION_LIFETIME,
        user,
      };
      setSession(nextSession);
      sessionStorage.setItem(SESSION_KEY, serializeSession(nextSession));
    },
    [setSession],
  );

  const destroySession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(undefined);
  }, [setUser]);

  return (
    <SessionContext.Provider value={[session.user, setUser, destroySession]}>
      {children}
    </SessionContext.Provider>
  );
};

export const useUser = () => useContext(SessionContext);
