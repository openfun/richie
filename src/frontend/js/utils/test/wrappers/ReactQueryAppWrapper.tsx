import { PropsWithChildren } from 'react';
import { IntlWrapper } from './IntlWrapper';
import { ReactQueryWrapper } from './ReactQueryWrapper';
import { AppWrapperProps } from './types';

export const ReactQueryAppWrapper = ({
  children,
  intlOptions,
  queryOptions,
}: PropsWithChildren<AppWrapperProps>) => {
  return (
    <IntlWrapper {...intlOptions}>
      <ReactQueryWrapper {...queryOptions}>{children}</ReactQueryWrapper>
    </IntlWrapper>
  );
};
