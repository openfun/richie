import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { findByText, render } from '@testing-library/react';
import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import { handle as mockHandle } from 'utils/errors/handle';
import { noop } from 'utils';
import { Root } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({ authentication: undefined }).generate(),
}));
jest.mock('utils/errors/handle');
jest.mock('components/UserLogin', () => ({
  __esModule: true,
  default: () => 'user login component rendered',
}));

jest.mock('components/RootSearchSuggestField', () => ({
  __esModule: true,
  default: ({ exampleProp }: { exampleProp: string }) =>
    `root search suggest field component rendered with ${exampleProp}`,
}));

jest.mock('data/SessionProvider', () => ({
  __esModule: true,
  SessionProvider: (props: PropsWithChildren<any>) => props.children,
}));

describe('<Root />', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(noop);
    jest.spyOn(console, 'warn').mockImplementation(noop);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('finds all richie-react containers and renders the relevant components into them with their passed props', async () => {
    // Create the containers for the two components we're about to render
    const userLoginContainer = document.createElement('div');
    userLoginContainer.setAttribute('class', 'richie-react richie-react--user-login');
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
        <Root richieReactSpots={[userLoginContainer, rootSearchSuggestFieldContainer]} />
      </IntlProvider>,
    );

    await findByText(userLoginContainer, 'user login component rendered');
    await findByText(
      rootSearchSuggestFieldContainer,
      'root search suggest field component rendered with the prop value',
    );
  });

  it('prints a console warning and still renders everything else when it fails to find a component', async () => {
    // Create the containers for the component we're about to render
    const userLoginContainer = document.createElement('div');
    userLoginContainer.setAttribute('class', 'richie-react richie-react--user-login');
    document.body.append(userLoginContainer);
    // On the other hand, <UserFeedback /> is not a component that exists in Richie
    const userFeedbackContainer = document.createElement('div');
    userFeedbackContainer.setAttribute('class', 'richie-react richie-react--user-feedback');
    document.body.append(userFeedbackContainer);

    // Render the root component, passing our real element and our bogus one
    render(
      <IntlProvider locale="en">
        <Root richieReactSpots={[userFeedbackContainer, userLoginContainer]} />
      </IntlProvider>,
    );

    await findByText(userLoginContainer, 'user login component rendered');
    await findByText(userFeedbackContainer, '');
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to load React component: no such component in Library UserFeedback',
    );
  });

  it('renders properly components even if one of them raises an error', async () => {
    // Create a <UserLogin /> component which renders properly
    const userLoginContainer = document.createElement('div');
    userLoginContainer.setAttribute('class', 'richie-react richie-react--user-login');
    document.body.append(userLoginContainer);
    // On the other hand, <Search /> component raises an error
    jest.doMock('components/Search', () => {
      throw Error('Failed to render Search component.');
    });
    const searchFailingComponent = document.createElement('div');
    searchFailingComponent.setAttribute('class', 'richie-react richie-react--search');
    document.body.append(searchFailingComponent);

    // Render the root component, passing our real element and our bogus one
    render(
      <IntlProvider locale="en">
        <Root richieReactSpots={[userLoginContainer, searchFailingComponent]} />
      </IntlProvider>,
    );

    await findByText(userLoginContainer, 'user login component rendered');
    expect(mockHandle).toHaveBeenCalledWith(new Error('Failed to render Search component.'));
  });
});
