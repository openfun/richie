import { PropsWithChildren } from 'react';

import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { IntlWrapper } from './IntlWrapper';
import { ReactQueryWrapper } from './ReactQueryWrapper';
import { AppWrapperProps } from './types';

export const BaseJoanieAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <IntlWrapper {...(intlOptions || { locale: 'en' })}>
      <ReactQueryWrapper {...(queryOptions || {})}>
        <JoanieSessionProvider>{children}</JoanieSessionProvider>
      </ReactQueryWrapper>
    </IntlWrapper>
  );
};
