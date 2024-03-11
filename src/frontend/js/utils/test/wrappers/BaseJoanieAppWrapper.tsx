import { PropsWithChildren } from 'react';

import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { AppWrapperProps } from './types';
import { ReactQueryAppWrapper } from './ReactQueryAppWrapper';

export const BaseJoanieAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <ReactQueryAppWrapper queryOptions={queryOptions} intlOptions={intlOptions}>
      <JoanieSessionProvider>{children}</JoanieSessionProvider>
    </ReactQueryAppWrapper>
  );
};
