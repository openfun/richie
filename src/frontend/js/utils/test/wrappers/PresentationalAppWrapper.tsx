import { PropsWithChildren } from 'react';
import { IntlWrapperProps } from './IntlWrapper';
import { RouterWrapper, RouterWrapperProps } from './RouterWrapper';
import AppWrapper from './AppWrapper';

export const PresentationalAppWrapper = ({
  children,
  intlOptions,
  routerOptions,
}: PropsWithChildren<{ intlOptions?: IntlWrapperProps; routerOptions?: RouterWrapperProps }>) => {
  return (
    <AppWrapper intlOptions={intlOptions}>
      <RouterWrapper {...routerOptions}>{children}</RouterWrapper>
    </AppWrapper>
  );
};
