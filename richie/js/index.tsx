/**
 * Interoperate with the outside world (aka Django / DjangoCMS)
 * ---
 * Detect elements in the current page that are expecting a React component to be started up. Find the relevant
 * one in our library and actually do render it in the appropriate element.
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

// Import submodules so we don't get the whole of lodash in the bundle
import get from 'lodash-es/get';
import includes from 'lodash-es/includes';
import startCase from 'lodash-es/startCase';

import { bootstrapStore } from './bootstrap';

// Import the top-level components that can be directly called from the CMS
import { SearchContainer } from './components/searchContainer/searchContainer';
// List them in an interface for type-safety when we call them. This will let us use the props for
// any top-level component in a way TypeScript understand and accepts
interface ComponentLibrary {
  SearchContainer: typeof SearchContainer;
}
// Actually create the component map that we'll use below to access our component classes
const componentLibrary: ComponentLibrary = {
  SearchContainer,
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
  // Bootstrap the Redux store using the configureStore function from /data. Can make use of embedded
  // data put there by the Django page.
  const store = bootstrapStore();

  // Find all the elements that need React to render a component
  Array.prototype.forEach.call(
    document.querySelectorAll('.fun-react'),
    (element: Element) => {
      // Generate a component name. It should be a key of the componentLibrary object / ComponentLibrary interface
      const componentName = startCase(
        get(element.className.match(/fun-react--([a-zA-Z-]*)/), '[1]') || '',
      )
        .split(' ')
        .join('');
      // Sanity check: only attempt to access and render components for which we do have a valid name
      if (isComponentName(componentName)) {
        // Do get the component dynamically. We know this WILL produce a valid component thanks to the type guard
        const Component = componentLibrary[componentName];
        // Render the component inside a `react-redux` store Provider so its children can be `connect`ed
        ReactDOM.render(
          <Provider store={store}>
            <Component />
          </Provider>,
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
