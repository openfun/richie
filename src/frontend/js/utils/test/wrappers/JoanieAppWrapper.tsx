import { CunninghamProvider } from '@openfun/cunningham-react';
import { PropsWithChildren } from 'react';
import fetchMock from 'fetch-mock';
import { DashboardBreadcrumbsProvider } from 'widgets/Dashboard/contexts/DashboardBreadcrumbsContext';
import { RouterWrapper } from './RouterWrapper';
import { AppWrapperProps } from './types';
import { BaseJoanieAppWrapper } from './BaseJoanieAppWrapper';

export const setupJoanieSession = () => {
  beforeEach(() => {
    // JoanieSessionProvider inital requests
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  return {
    nbSessionApiRequest: 3,
  };
};

export const JoanieAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
  routerOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <BaseJoanieAppWrapper intlOptions={intlOptions} queryOptions={queryOptions}>
      <CunninghamProvider>
        <DashboardBreadcrumbsProvider>
          <RouterWrapper {...routerOptions}>{children}</RouterWrapper>
        </DashboardBreadcrumbsProvider>
      </CunninghamProvider>
    </BaseJoanieAppWrapper>
  );
};
