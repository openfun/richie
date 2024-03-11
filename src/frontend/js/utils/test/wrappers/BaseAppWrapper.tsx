import { PropsWithChildren } from 'react';
import { SessionProvider } from 'contexts/SessionContext';
import { AppWrapperProps } from './types';
import { ReactQueryAppWrapper } from './ReactQueryAppWrapper';

export const BaseAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <ReactQueryAppWrapper queryOptions={queryOptions} intlOptions={intlOptions}>
      <SessionProvider>{children}</SessionProvider>
    </ReactQueryAppWrapper>
  );
};
