import get from 'lodash-es/get';
import includes from 'lodash-es/includes';
import startCase from 'lodash-es/startCase';
import { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom';
import { HistoryProvider } from 'hooks/useHistory';
import { SessionProvider } from 'contexts/SessionContext';
import { Spinner } from 'components/Spinner';
import ErrorBoundary from 'utils/errors/ErrorBoundary';
import context from 'utils/context';

const Dashboard = lazy(() => import('widgets/Dashboard'));
const LanguageSelector = lazy(() => import('widgets/LanguageSelector'));
const LtiConsumer = lazy(() => import('widgets/LtiConsumer'));
const RootSearchSuggestField = lazy(() => import('widgets/RootSearchSuggestField'));
const Search = lazy(() => import('widgets/Search'));
const SearchSuggestField = lazy(() => import('widgets/SearchSuggestField'));
const SyllabusCourseRunsList = lazy(() => import('widgets/SyllabusCourseRunsList'));
const UserLogin = lazy(() => import('widgets/UserLogin'));

// List the top-level components that can be directly called from the Django templates in an interface
// for type-safety when we call them. This will let us use the props for any top-level component in a
// way TypeScript understand and accepts
interface ComponentLibrary {
  Dashboard: typeof Dashboard;
  LanguageSelector: typeof LanguageSelector;
  LtiConsumer: typeof LtiConsumer;
  RootSearchSuggestField: typeof RootSearchSuggestField;
  Search: typeof Search;
  SearchSuggestField: typeof SearchSuggestField;
  SyllabusCourseRunsList: typeof SyllabusCourseRunsList;
  UserLogin: typeof UserLogin;
}
// Actually create the component map that we'll use below to access our component classes
const componentLibrary: ComponentLibrary = {
  Dashboard,
  LanguageSelector,
  LtiConsumer,
  RootSearchSuggestField,
  Search,
  SearchSuggestField,
  SyllabusCourseRunsList,
  UserLogin,
};
// Type guard: ensures a given string (candidate) is indeed a proper key of the componentLibrary with a corresponding
// component. This is a runtime check but it allows TS to check the component prop types at compile time
function isComponentName(
  candidate: keyof ComponentLibrary | string,
): candidate is keyof ComponentLibrary {
  return includes(Object.keys(componentLibrary), candidate);
}

interface RootProps {
  richieReactSpots: Element[];
}

export const Root = ({ richieReactSpots }: RootProps) => {
  const portals = richieReactSpots.map((element: Element) => {
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

      let props: any = {};

      // Get the props to pass our components from the `data-props-source` if
      const dataPropsSource = element.getAttribute('data-props-source');
      if (dataPropsSource) {
        props = JSON.parse(document.querySelector(dataPropsSource)!.textContent!);
      }

      // Get the incoming props to pass our component from `data-props` if applicable
      const dataProps = element.getAttribute('data-props');
      if (dataProps) {
        props = { ...props, ...JSON.parse(dataProps) };
      }

      // Add context to props if they do not already include it
      if (!props.context) {
        props.context = context;
      }

      return ReactDOM.createPortal(
        <ErrorBoundary>
          <Component {...props} />
        </ErrorBoundary>,
        element,
      );
    } else {
      // Emit a warning at runtime when we fail to find a matching component for an element that required one
      console.warn('Failed to load React component: no such component in Library ' + componentName);
      return null;
    }
  });

  return (
    <SessionProvider>
      <HistoryProvider>
        <Suspense fallback={<Spinner />}>{portals}</Suspense>
      </HistoryProvider>
    </SessionProvider>
  );
};
