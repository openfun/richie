/**
 * Interoperate with the outside world (aka Django / DjangoCMS)
 * ---
 * Detect elements in the current page that are expecting a React component to be started up. Find the relevant
 * one in our library and actually do render it in the appropriate element.
 */

// Currently, @babel/preset-env is unaware that using import() with Webpack relies on Promise internally.
// Environments which do not have builtin support for Promise, like Internet Explorer, will require both
// the promise and iterator polyfills be added manually.
import 'core-js/modules/es.array.iterator';
import 'core-js/modules/es.promise';

import React from 'react';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

// Import submodules so we don't get the whole of lodash in the bundle
import get from 'lodash-es/get';
import includes from 'lodash-es/includes';
import startCase from 'lodash-es/startCase';

// Import the top-level components that can be directly called from the CMS
import { RootSearchSuggestField } from 'components/RootSearchSuggestField';
import { Search } from 'components/Search';
import { UserLogin } from 'components/UserLogin';
import { handle } from 'utils/errors/handle';
// List them in an interface for type-safety when we call them. This will let us use the props for
// any top-level component in a way TypeScript understand and accepts
interface ComponentLibrary {
  Search: typeof Search;
  RootSearchSuggestField: typeof RootSearchSuggestField;
  UserLogin: typeof UserLogin;
}
// Actually create the component map that we'll use below to access our component classes
const componentLibrary: ComponentLibrary = {
  RootSearchSuggestField,
  Search,
  UserLogin,
};
// Type guard: ensures a given string (candidate) is indeed a proper key of the componentLibrary with a corresponding
// component. This is a runtime check but it allows TS to check the component prop types at compile time
function isComponentName(
  candidate: keyof ComponentLibrary | string,
): candidate is keyof ComponentLibrary {
  return includes(Object.keys(componentLibrary), candidate);
}

// Wait for the DOM to load before we scour it for an element that requires React to be rendered
document.addEventListener('DOMContentLoaded', async event => {
  // Find all the elements that need React to render a component
  const richieReactSpots = Array.prototype.slice.call(
    document.querySelectorAll('.richie-react'),
  );

  // Only move on with anything if there are actually components to render
  if (richieReactSpots.length) {
    // Determine the BCP47/RFC5646 locale to use
    const locale = document.querySelector('html')!.getAttribute('lang');

    if (!locale) {
      throw new Error(
        '<html> lang attribute is required to be set with a BCP47/RFC5646 locale.',
      );
    }

    // Only load Intl polyfills & pre-built locale data for browsers that need it
    try {
      if (!Intl.PluralRules) {
        await import('intl-pluralrules');
      }
      // TODO: remove type assertion when typescript libs include RelativeTimeFormat
      if (!(Intl as any).RelativeTimeFormat) {
        await import('@formatjs/intl-relativetimeformat');
        // Polyfilled locale data is keyed by 2-letter language code
        let languageCode = locale;
        if (languageCode.match(/^.*_.*$/)) {
          languageCode = locale.split('_')[0];
        }
        // Get `react-intl`/`formatjs` lang specific parameters and data
        await import(
          `@formatjs/intl-relativetimeformat/dist/locale-data/${languageCode}`
        );
      }
    } catch (e) {
      handle(e);
    }

    // Load our own strings for the given lang
    let translatedMessages: any = null;
    try {
      translatedMessages = await import(`./translations/${locale}.json`);
    } catch (e) {
      handle(e);
    }

    richieReactSpots.forEach((element: Element) => {
      // Generate a component name. It should be a key of the componentLibrary object / ComponentLibrary interface
      const componentName = startCase(
        get(element.className.match(/richie-react--([a-zA-Z-]*)/), '[1]') || '',
      )
        .split(' ')
        .join('');
      // Sanity check: only attempt to access and render components for which we do have a valid name
      if (isComponentName(componentName)) {
        // Do get the component dynamically. We know this WILL produce a valid component thanks to the type guard
        const Component = componentLibrary[componentName];

        // Get the incoming props to pass our component from the `data-props` attribute
        const dataProps = element.getAttribute('data-props');
        const props = dataProps ? JSON.parse(dataProps) : {};

        // Render the component inside an `IntlProvider` to be able to access translated strings
        ReactDOM.render(
          <IntlProvider locale={locale} messages={translatedMessages}>
            <Component {...props} />
          </IntlProvider>,
          element,
        );
      } else {
        // Emit a warning at runtime when we fail to find a matching component for an element that required one
        console.warn(
          'Failed to load React component: no such component in Library ' +
            componentName,
        );
      }
    });
  }
});
