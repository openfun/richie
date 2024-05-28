import { PropsWithChildren } from 'react';

import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { AppWrapperProps } from './types';
import AppWrapper from './AppWrapper';

export const BaseJoanieAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <AppWrapper queryOptions={queryOptions} intlOptions={intlOptions}>
      <JoanieSessionProvider>{children}</JoanieSessionProvider>
    </AppWrapper>
  );
};
