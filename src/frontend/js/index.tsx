/**
 * Interoperate with the outside world (aka Django / DjangoCMS)
 * ---
 * Detect elements in the current page that are expecting a React component to be started up. Find the relevant
 * one in our library and actually do render it in the appropriate element.
 */

// Those two polyfills are required for webpack async loaders, which use them internally,
// regardless of their use throughout the Richie codebase itself.
import 'core-js/modules/es.array.iterator';
import 'core-js/modules/es.promise';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import countries from 'i18n-iso-countries';
import { createRoot } from 'react-dom/client';
import createQueryClient from 'utils/react-query/createQueryClient';
import { Root } from 'widgets';
import { MOCK_SERVICE_WORKER_ENABLED } from 'settings';
import { handle } from 'utils/errors/handle';

// Wait for the DOM to load before we scour it for an element that requires React to be rendered
async function render() {
  // Find all the elements that need React to render a component
  const richieReactSpots = Array.prototype.slice.call(document.querySelectorAll('.richie-react'));

  // Only move on with anything if there are actually components to render
  if (richieReactSpots.length) {
    // Determine the BCP47/RFC5646 locale to use
    const locale = document.querySelector('html')!.getAttribute('lang');

    if (!locale) {
      throw new Error('<html> lang attribute is required to be set with a BCP47/RFC5646 locale.');
    }

    const [languageCode, countryCode] = locale.split('-');

    // Polyfill outdated browsers who do not have Node.prototype.append
    if (
      !Element.prototype.hasOwnProperty('append') &&
      !Document.prototype.hasOwnProperty('append') &&
      !DocumentFragment.prototype.hasOwnProperty('append')
    ) {
      await import('mdn-polyfills/Node.prototype.append');
    }

    // Polyfill outdated browsers who do not have fetch
    if (typeof fetch === 'undefined') {
      await import('whatwg-fetch');
    }

    // Only load Intl polyfills & pre-built locale data for browsers that need it
    try {
      if (!Intl.PluralRules) {
        await import('intl-pluralrules');
      }

      if (!Intl.RelativeTimeFormat) {
        await import('@formatjs/intl-relativetimeformat');

        // When countryCode is identical to languageCode, intlrelativeformat uses
        // only languageCode as locale file name
        let localeFilename = locale;
        if (RegExp(languageCode, 'i').test(countryCode)) {
          localeFilename = languageCode;
        }

        // Get `react-intl`/`formatjs` lang specific parameters and data
        await import(`@formatjs/intl-relativetimeformat/locale-data/${localeFilename}`);
      }
    } catch (e) {
      handle(e);
    }

    // Load our own strings for the given lang
    let translatedMessages: any = null;
    try {
      translatedMessages = await import(`./translations/${locale}.json`);
    } catch (e) {
      // Richie implicitly uses 'en-US' as its default locales: it does not provide localization files and strings
      // for this locale but instead relies on them being the default messages throughout the code.
      // We therefore do not want to report errors for a missing locale file that is not expected to exist in stock
      // Richie. We still want errors if another locale is expected but missing, and we still want to log something
      // to the console so Richie users who provide their own 'en-US' strings are warned if they are not loaded.
      if (locale === 'en-US') {
        // eslint-disable-next-line no-console
        console.log('No localization file found for default en-US locale, using default messages.');
      } else {
        handle(e);
      }
    }

    try {
      countries.registerLocale(require(`i18n-iso-countries/langs/${languageCode}.json`));
    } catch (e) {
      handle(e);
    }

    // Create a react root element we'll render into. Note that this is just used to anchor our React tree in an
    // arbitraty place since all our actual UI components will be rendered into their own containers through portals.
    const rootContainer = document.createElement('div');
    rootContainer.setAttribute('class', 'richie-react richie-react--root');
    document.body.append(rootContainer);

    // React-query
    const queryClient = createQueryClient({ logger: true, persister: true });

    // Mock service worker
    if (process.env.NODE_ENV === 'development' && MOCK_SERVICE_WORKER_ENABLED) {
      const { worker } = require('../mocks/browser');
      worker.start({
        onUnhandledRequest: 'bypass',
      });
    }

    // Render the tree inside a shared `IntlProvider` so all components are able to access translated strings.
    const reactRoot = createRoot(rootContainer);
    reactRoot.render(
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale={locale} messages={translatedMessages} defaultLocale="en-US">
          <Root richieReactSpots={richieReactSpots} />
        </IntlProvider>
      </QueryClientProvider>,
    );
  }
}

document.addEventListener('DOMContentLoaded', render);

// In some case, you would like to render Richie components manually
window.__RICHIE__ = Object.create({ render });
