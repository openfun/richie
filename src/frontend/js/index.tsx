/**
 * Interoperate with the outside world (aka Django / DjangoCMS)
 * ---
 * Detect elements in the current page that are expecting a React component to be started up. Find the relevant
 * one in our library and actually do render it in the appropriate element.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { addLocaleData, IntlProvider } from 'react-intl';

// Import submodules so we don't get the whole of lodash in the bundle
import get from 'lodash-es/get';
import includes from 'lodash-es/includes';
import startCase from 'lodash-es/startCase';

// Import the top-level components that can be directly called from the CMS
import { Search } from './components/Search/Search';
// List them in an interface for type-safety when we call them. This will let us use the props for
// any top-level component in a way TypeScript understand and accepts
interface ComponentLibrary {
  Search: typeof Search;
}
// Actually create the component map that we'll use below to access our component classes
const componentLibrary: ComponentLibrary = {
  Search,
};
// Type guard: ensures a given string (candidate) is indeed a proper key of the componentLibrary with a corresponding
// component. This is a runtime check but it allows TS to check the component prop types at compile time
function isComponentName(
  candidate: keyof ComponentLibrary | string,
): candidate is keyof ComponentLibrary {
  return includes(Object.keys(componentLibrary), candidate);
}

// Wait for the DOM to load before we scour it for an element that requires React to be rendered
document.addEventListener('DOMContentLoaded', event => {
  // Find all the elements that need React to render a component
  Array.prototype.forEach.call(
    document.querySelectorAll('.fun-react'),
    async (element: Element) => {
      // Generate a component name. It should be a key of the componentLibrary object / ComponentLibrary interface
      const componentName = startCase(
        get(element.className.match(/fun-react--([a-zA-Z-]*)/), '[1]') || '',
      )
        .split(' ')
        .join('');
      // Sanity check: only attempt to access and render components for which we do have a valid name
      if (isComponentName(componentName)) {
        const locale = element.getAttribute('data-locale') || 'en';
        let localeCode = locale;
        if (localeCode.match(/^.*_.*$/)) {
          localeCode = locale.split('_')[0];
        }

        try {
          const localeData = await import(
            `react-intl/locale-data/${localeCode}`
          );
          // async import returns an object of getters containing the value we want. We have to fetch them
          // by calling Object.values
          addLocaleData(Object.values(localeData));
        } catch (e) {}

        let translatedMessages = null;
        try {
          translatedMessages = await import(`./translations/${locale}.json`);
        } catch (e) {}

        // Do get the component dynamically. We know this WILL produce a valid component thanks to the type guard
        const Component = componentLibrary[componentName];
        // Render the component inside an `IntlProvider` to be able to access translated strings
        ReactDOM.render(
          <IntlProvider locale={localeCode} messages={translatedMessages}>
            <Component />
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
    },
  );
});
