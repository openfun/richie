import { ComponentProps, PropsWithChildren } from 'react';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';

export interface IntlWrapperProps extends PropsWithChildren, ComponentProps<typeof IntlProvider> {}

export const IntlWrapper = ({ children, ...options }: IntlWrapperProps) => (
  <IntlProvider
    onError={(err) => {
      // https://github.com/formatjs/formatjs/issues/465
      if (
        err.code === ReactIntlErrorCode.MISSING_TRANSLATION ||
        err.code === ReactIntlErrorCode.MISSING_DATA
      ) {
        return;
      }
      throw err;
    }}
    {...options}
    locale={options?.locale || 'en'}
  >
    {children}
  </IntlProvider>
);
