import { PropsWithChildren } from 'react';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { IntlWrapper, IntlWrapperProps } from './IntlWrapper';
import { RouterWrapper, RouterWrapperProps } from './RouterWrapper';

export const PresentationalAppWrapper = ({
  children,
  intlOptions,
  routerOptions,
}: PropsWithChildren<{ intlOptions?: IntlWrapperProps; routerOptions?: RouterWrapperProps }>) => {
  return (
    <IntlWrapper {...(intlOptions || { locale: 'en' })}>
      <CunninghamProvider>
        <RouterWrapper {...routerOptions}>{children}</RouterWrapper>
      </CunninghamProvider>
    </IntlWrapper>
  );
};
