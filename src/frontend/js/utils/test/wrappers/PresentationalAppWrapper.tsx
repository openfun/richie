import { PropsWithChildren } from 'react';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { IntlWrapper } from './IntlWrapper';
import { RouterWrapper } from './RouterWrapper';
import { AppWrapperProps } from './types';

export const PresentationalAppWrapper = ({
  children,
  options,
}: PropsWithChildren<{ options?: AppWrapperProps }>) => {
  return (
    <IntlWrapper {...(options?.intlOptions || { locale: 'en' })}>
      <CunninghamProvider>
        <RouterWrapper {...options?.routerOptions}>{children}</RouterWrapper>
      </CunninghamProvider>
    </IntlWrapper>
  );
};
