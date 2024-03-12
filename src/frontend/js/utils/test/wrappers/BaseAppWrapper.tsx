import { PropsWithChildren } from 'react';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
import { AppWrapperProps } from './types';
import { ReactQueryAppWrapper } from './ReactQueryAppWrapper';

export const BaseAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <ReactQueryAppWrapper queryOptions={queryOptions} intlOptions={intlOptions}>
      <BaseSessionProvider>{children}</BaseSessionProvider>
    </ReactQueryAppWrapper>
  );
};
