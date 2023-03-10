import countries from 'i18n-iso-countries';
import { lazy, ReactNode, Suspense } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { User } from 'types/User';
import { createTestQueryClient, CreateTestQueryClientParams } from '../test/createTestQueryClient';

const LazyJoanieSessionProvider = lazy(
  () => import('contexts/SessionContext/JoanieSessionProvider'),
);

export class StorybookHelper {
  static wrapInApp(children: ReactNode, opts?: { user?: User } & CreateTestQueryClientParams) {
    const client = createTestQueryClient({ persister: true, logger: true, ...opts });

    countries.registerLocale(require(`i18n-iso-countries/langs/en.json`));
    return (
      <QueryClientProvider client={client}>
        <IntlProvider locale="en">
          <Suspense fallback="Loading ...">
            <LazyJoanieSessionProvider>{children}</LazyJoanieSessionProvider>
          </Suspense>
        </IntlProvider>
      </QueryClientProvider>
    );
  }
}
