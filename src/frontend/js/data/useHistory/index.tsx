import queryString from 'query-string';
import { createContext, PropsWithChildren, useEffect, useState, useContext } from 'react';

import { history, location } from 'utils/indirection/window';
import { Maybe, Nullable } from 'types/utils';

interface HistoryEntry {
  state: any;
  title: string;
  url: Maybe<Nullable<URL | string>>;
}

type PushStateFn = typeof history.pushState;
type ReplaceStateFn = typeof history.replaceState;

type PopstateEventListener = (this: Window, ev: WindowEventMap['popstate']) => any;

export type History = [HistoryEntry, PushStateFn, ReplaceStateFn];

export const HistoryContext = createContext<History>([] as any);

export const useHistory = () => {
  return useContext(HistoryContext);
};

export const HistoryProvider = ({ children }: PropsWithChildren<{}>) => {
  const historyValue = useProvideHistory();
  return <HistoryContext.Provider value={historyValue}>{children}</HistoryContext.Provider>;
};

const useProvideHistory: () => History = () => {
  const [historyEntry, setHistoryEntry] = useState<HistoryEntry>({
    state: { name: '', data: { params: queryString.parse(location.search) } },
    title: '',
    url: `${location.pathname}${location.search}`,
  });

  // Match the signature and function of the browser's pushState.
  // This is useful when we add history entries after user interaction from our own code.
  const pushState: PushStateFn = (state, title, url) => {
    setHistoryEntry({ state, title, url });
    history.pushState(state, title, url);
  };

  // Match the signature and function of the browser's replaceState/
  // This is useful when a component needs to set eg. default query string params to avoid creating broken
  // history states.
  const replaceState: ReplaceStateFn = (state, title, url) => {
    setHistoryEntry({ state, title, url });
    history.replaceState(state, title, url);
  };

  // Listen to external changes to history to make sure we re-render any component(s) that depend on
  // the contents of the URL and the current history entry
  useEffect(() => {
    const handlePopstate: PopstateEventListener = (event) => {
      setHistoryEntry({
        state: event.state,
        title: '',
        url: `${location.pathname}${location.search}`,
      });
    };

    window.addEventListener('popstate', handlePopstate);

    return () => {
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  return [historyEntry, pushState, replaceState];
};
