import { PropsWithChildren } from 'react';
import { QueryClient } from '@tanstack/query-core';
import { RenderOptions as TestingLibraryRenderOptions } from '@testing-library/react';
import { Nullable } from 'types/utils';
import { History } from 'hooks/useHistory';
import { IntlWrapperProps } from './IntlWrapper';
import { RouterWrapperProps } from './RouterWrapper';

interface QueryOptions {
  client: QueryClient;
}

/**
 * Options to configure the render of a component for a test
 *
 * @property testingLibraryOptions options provided by react-testing-library to the render method
 * @property intlOptions options to configure i18n context
 * @property routerOptions options to configure router and routes in the test
 * @property queryOptions options to configure a custom client used by react-query for a test
 */
export interface AppWrapperProps {
  wrapper?: Nullable<(props: PropsWithChildren<{ options?: AppWrapperProps }>) => JSX.Element>;
  intlOptions?: IntlWrapperProps;
  queryOptions?: QueryOptions;
  historyOptions?: History;
  routerOptions?: RouterWrapperProps;
  testingLibraryOptions?: TestingLibraryRenderOptions;
}
