import type { PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';
import type * as Joanie from 'types/Joanie';
import API from 'api/joanie';
import type { Maybe } from 'types/utils';

const JoanieApiContext = createContext<Maybe<Joanie.API>>(undefined);

/**
 * Provider to access to the Joanie API interface.
 */
const JoanieApiProvider = ({ children }: PropsWithChildren<{}>) => {
  const api = API();

  return <JoanieApiContext.Provider value={api}>{children}</JoanieApiContext.Provider>;
};

/**
 * Hook to use within `JoanieApiProvider`. It returns the joanie api interface.
 */
export const useJoanieApi = () => {
  const context = useContext(JoanieApiContext);

  if (context === undefined) {
    throw new Error('useJoanieApi must be used within a JoanieApiProvider.');
  }

  return context;
};

export default JoanieApiProvider;
