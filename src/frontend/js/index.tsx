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
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import countries from 'i18n-iso-countries';
import createQueryClient from 'utils/react-query/createQueryClient';

import { Root } from 'components/Root';
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
      // TODO: remove type assertion when typescript libs include RelativeTimeFormat
      if (!(Intl as any).RelativeTimeFormat) {
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
    const reactRoot = document.createElement('div');
    reactRoot.setAttribute('class', 'richie-react richie-react--root');
    document.body.append(reactRoot);

    // React-query
    const queryClient = createQueryClient({ logger: true, persistor: true });

    // Render the tree inside a shared `IntlProvider` so all components are able to access translated strings.
    ReactDOM.render(
      <QueryClientProvider client={queryClient}>
        <IntlProvider locale={locale} messages={translatedMessages} defaultLocale="en-US">
          <Root richieReactSpots={richieReactSpots} />
        </IntlProvider>
      </QueryClientProvider>,
      reactRoot,
    );
  }
}

document.addEventListener('DOMContentLoaded', render);

// In some case, you would like to render Richie components manually
window.__RICHIE__ = Object.create({ render });
