import { RenderResult, screen, render as testingLibraryRender } from '@testing-library/react';
import React, { ReactElement } from 'react';
import { Nullable } from 'types/utils';
import { AppWrapperProps } from './wrappers/types';
import { JoanieAppWrapper } from './wrappers/JoanieAppWrapper';

//  ------- setup -------

type CustomRenderResult = Omit<RenderResult, 'rerender'> & {
  elementContainer: Nullable<HTMLElement>;
  rerender: (
    element: ReactElement,
    options?: Partial<Omit<AppWrapperProps, 'testingLibraryOptions'>>,
  ) => void;
};

type RenderFunction = (
  element: ReactElement,
  options?: Partial<AppWrapperProps>,
) => CustomRenderResult;

/**
 *
 * Custom render method base on react-testing-library render method.
 * This will render {@param element} in JSDom and read options to configure context and render.
 * It also override react-testing-library rerender method to also wrap the provided component in
 * the same contexts.
 *
 * The provided {@param element} is to be wrapped in :
 * - react router (react-router-dom)
 * - react i18n context (react-intl)
 * - query context (react-query)
 *
 * This function uses default values:
 * options.intlOptions.locale : 'en'
 * options.routerOptions.path : '/'
 * options.queryOptions.client : {@see queryClient}
 *
 *
 * @param element element to wrap in application contexts and test
 * @param options options to configure and/or customize wrapped context for the test {@see RenderOptions}
 * @returns an object with all values return by react-testing-library render methods
 * and an other property {@property elementContainer} refering to the exact element containing the {@param element} to test
 *
 *
 * @example
 * customRender(<SomeComponentToTest />);
 * customRender(<SomeComponentToTest />, { wrapper: WrapperPresentationalApp });
 */
export const render: RenderFunction = (
  element: ReactElement,
  options?: Partial<AppWrapperProps>,
) => {
  const Wrapper = options?.wrapper === undefined ? JoanieAppWrapper : options?.wrapper;
  const renderResult = testingLibraryRender(
    Wrapper === null ? element : <Wrapper {...options}>{element}</Wrapper>,
    options?.testingLibraryOptions,
  );

  return {
    ...renderResult,
    elementContainer: screen.queryByTestId('test-component-container'),
    rerender: (
      rerenderElement: ReactElement,
      rerenderOptions?: Partial<Omit<AppWrapperProps, 'testingLibraryOptions'>>,
    ) => {
      return renderResult.rerender(
        Wrapper === null ? element : <Wrapper {...rerenderOptions}>{rerenderElement}</Wrapper>,
      );
    },
  };
};
