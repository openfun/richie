import { PropsWithChildren } from 'react';
import { SessionProvider } from 'contexts/SessionContext';
import { IntlWrapper } from './IntlWrapper';
import { ReactQueryWrapper } from './ReactQueryWrapper';
import { AppWrapperProps } from './types';

export const BaseAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <IntlWrapper {...(intlOptions || { locale: 'en' })}>
      <ReactQueryWrapper {...(queryOptions || {})}>
        <SessionProvider>{children}</SessionProvider>
      </ReactQueryWrapper>
    </IntlWrapper>
  );
};
