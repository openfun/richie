import React from 'react';
import { IntlProvider } from 'react-intl';

import { getByText, render } from '@testing-library/react';
import { Root } from '.';

jest.mock('components/UserLogin', () => ({
  UserLogin: () => 'user login component rendered',
}));

jest.mock('components/RootSearchSuggestField', () => ({
  RootSearchSuggestField: ({ exampleProp }: { exampleProp: string }) =>
    `root search suggest field component rendered with ${exampleProp}`,
}));

describe('<Root />', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(jest.restoreAllMocks);

  it('finds all richie-react containers and renders the relevant components into them with their passed props', () => {
    // Create the containers for the two components we're about to render
    const userLoginContainer = document.createElement('div');
    userLoginContainer.setAttribute(
      'class',
      'richie-react richie-react--user-login',
    );
    document.body.append(userLoginContainer);
    const rootSearchSuggestFieldContainer = document.createElement('div');
    rootSearchSuggestFieldContainer.setAttribute(
      'class',
      'richie-react richie-react--root-search-suggest-field',
    );
    rootSearchSuggestFieldContainer.setAttribute(
      'data-props',
      JSON.stringify({ exampleProp: 'the prop value' }),
    );
    document.body.append(rootSearchSuggestFieldContainer);

    // Render the root component, passing the elements in need of frontend rendering
    render(
      <IntlProvider locale="en">
        <Root
          richieReactSpots={[
            userLoginContainer,
            rootSearchSuggestFieldContainer,
          ]}
        />
      </IntlProvider>,
    );

    getByText(userLoginContainer, 'user login component rendered');
    getByText(
      rootSearchSuggestFieldContainer,
      'root search suggest field component rendered with the prop value',
    );
  });

  it('prints a console warning and still renders everything else when it fails to find a component', () => {
    // Create the containers for the component we're about to render
    const userLoginContainer = document.createElement('div');
    userLoginContainer.setAttribute(
      'class',
      'richie-react richie-react--user-login',
    );
    document.body.append(userLoginContainer);
    // On the other hand, <UserFeedback /> is not a component that exists in Richie
    const userFeedbackContainer = document.createElement('div');
    userFeedbackContainer.setAttribute(
      'class',
      'richie-react richie-react--user-feedback',
    );
    document.body.append(userFeedbackContainer);

    // Render the root component, passing our real element and our bogus one
    render(
      <IntlProvider locale="en">
        <Root richieReactSpots={[userLoginContainer, userFeedbackContainer]} />
      </IntlProvider>,
    );

    getByText(userLoginContainer, 'user login component rendered');
    expect(userFeedbackContainer.innerHTML).toEqual('');
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to load React component: no such component in Library UserFeedback',
    );
  });
});
