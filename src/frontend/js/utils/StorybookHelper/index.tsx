import countries from 'i18n-iso-countries';
import { lazy, ReactNode, Suspense } from 'react';
import { IntlProvider } from 'react-intl';
import { hydrate, QueryClientProvider } from 'react-query';
import createQueryClient from 'utils/react-query/createQueryClient';
import { PersistedClientFactory, QueryStateFactory } from 'utils/test/factories';
import { User } from 'types/User';

const LazyJoanieSessionProvider = lazy(() => import('data/SessionProvider/JoanieSessionProvider'));

export class StorybookHelper {
  static wrapInApp(children: ReactNode, opts?: { user?: User }) {
    const { clientState } = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: opts?.user })],
    });
    const client = createQueryClient({ persistor: true });
    hydrate(client, clientState);

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
