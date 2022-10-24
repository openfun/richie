import { useContext, useEffect } from 'react';
import { DashboardBreadcrumbsContext } from 'components/DashboardBreadcrumbs/DashboardBreadcrumbsProvider';
import { DashboardBreadcrumbsPlaceholders } from 'components/DashboardBreadcrumbs';

/**
 * Hook to be used in every component that needs to provide a formatjs value to breadcrumbs's part.
 */
export const useBreadcrumbsPlaceholders = (data: DashboardBreadcrumbsPlaceholders) => {
  const context = useContext(DashboardBreadcrumbsContext);
  useEffect(() => {
    context.pushBreadcrumbsPlaceholders(data);
  }, [data]);
};
