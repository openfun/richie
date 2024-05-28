import { PropsWithChildren } from 'react';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
import { AppWrapperProps } from './types';
import AppWrapper from './AppWrapper';

export const BaseAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <AppWrapper queryOptions={queryOptions} intlOptions={intlOptions}>
      <BaseSessionProvider>{children}</BaseSessionProvider>
    </AppWrapper>
  );
};
