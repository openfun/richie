import countries from 'i18n-iso-countries';
import { lazy, ReactNode, Suspense } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import createQueryClient from 'utils/react-query/createQueryClient';

const LazyJoanieSessionProvider = lazy(() => import('data/SessionProvider/JoanieSessionProvider'));

export class StorybookHelper {
  static wrapInApp(children: ReactNode) {
    const queryClient = createQueryClient({ logger: true, persistor: true });
    countries.registerLocale(require(`i18n-iso-countries/langs/en.json`));
    return (
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale="en">
          <Suspense fallback="Loading ...">
            <LazyJoanieSessionProvider>{children}</LazyJoanieSessionProvider>
          </Suspense>
        </IntlProvider>
      </QueryClientProvider>
    );
  }
}
