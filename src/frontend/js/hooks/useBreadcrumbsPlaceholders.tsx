import { useContext, useEffect } from 'react';
import { DashboardBreadcrumbsPlaceholders } from 'widgets/Dashboard/components/DashboardBreadcrumbs';
import { DashboardBreadcrumbsContext } from 'widgets/Dashboard/contexts/DashboardBreadcrumbsContext';

/**
 * Hook to be used in every component that needs to provide a formatjs value to breadcrumbs's part.
 */
export const useBreadcrumbsPlaceholders = (data: DashboardBreadcrumbsPlaceholders) => {
  const context = useContext(DashboardBreadcrumbsContext);
  useEffect(() => {
    context.pushBreadcrumbsPlaceholders(data);
  }, [JSON.stringify(data)]);
};
