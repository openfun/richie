import { createContext, PropsWithChildren, useMemo, useState } from 'react';
import { noop } from 'utils';
import {
  DashboardBreadcrumbsMeta,
  DashboardBreadcrumbsPlaceholders,
} from '../components/DashboardBreadcrumbs';

interface DashboardBreadcrumbsContextInterface {
  pushBreadcrumbsPlaceholders: (data: DashboardBreadcrumbsPlaceholders) => void;
  meta: DashboardBreadcrumbsMeta;
}

export const DashboardBreadcrumbsContext = createContext<DashboardBreadcrumbsContextInterface>({
  meta: { placeholders: {} },
  pushBreadcrumbsPlaceholders: noop,
});

/**
 * Provider that needs to wrap any component using the DashboardBreadcrumbs component.
 * It provides a context used to make formatjs value available bottom up.
 */
export const DashboardBreadcrumbsProvider = ({ children }: PropsWithChildren<{}>) => {
  const [placeholders, setPlaceholders] = useState<DashboardBreadcrumbsPlaceholders>({});

  const pushBreadcrumbsPlaceholders = (data: DashboardBreadcrumbsPlaceholders) => {
    setPlaceholders({ ...placeholders, ...data });
  };

  // JSON.stringify is needed because `placeholders` is an object this is the same as doing a
  // shallow equality test. Otherwise, it will create an infinite re-rendering loop as the object
  // reference changes on each use of pushBreadcrumbsPlaceholders.
  const context = useMemo(
    () => ({
      pushBreadcrumbsPlaceholders,
      meta: { placeholders },
    }),
    [JSON.stringify(placeholders)],
  );

  return (
    <DashboardBreadcrumbsContext.Provider value={context}>
      {children}
    </DashboardBreadcrumbsContext.Provider>
  );
};
