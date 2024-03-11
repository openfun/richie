import { ComponentProps } from 'react';
import { IntlProvider, ReactIntlErrorCode } from 'react-intl';

export interface IntlWrapperProps extends Omit<ComponentProps<typeof IntlProvider>, 'locale'> {
  locale?: string;
}

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
