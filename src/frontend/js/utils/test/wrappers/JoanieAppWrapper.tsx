import { CunninghamProvider } from '@openfun/cunningham-react';
import { PropsWithChildren } from 'react';
import fetchMock from 'fetch-mock';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { IntlWrapper } from './IntlWrapper';
import { ReactQueryWrapper } from './ReactQueryWrapper';
import { RouterWrapper } from './RouterWrapper';
import { AppWrapperProps } from './types';

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

export const JoanieSessionWrapper = ({ children }: PropsWithChildren) => {
  return <JoanieSessionProvider>{children}</JoanieSessionProvider>;
};

export const JoanieAppWrapper = ({
  children,
  options,
}: PropsWithChildren<{ options?: AppWrapperProps }>) => {
  return (
    <IntlWrapper {...(options?.intlOptions || { locale: 'en' })}>
      <CunninghamProvider>
        <ReactQueryWrapper {...(options?.queryOptions || {})}>
          <JoanieSessionWrapper>
            <RouterWrapper {...options?.routerOptions}>{children}</RouterWrapper>
          </JoanieSessionWrapper>
        </ReactQueryWrapper>
      </CunninghamProvider>
    </IntlWrapper>
  );
};
