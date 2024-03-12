import type { PropsWithChildren } from 'react';
import { findByText } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { handle as mockHandle } from 'utils/errors/handle';
import { noop } from 'utils';
import { render } from 'utils/test/render';
import { IntlWrapper } from 'utils/test/wrappers/IntlWrapper';
import { Root } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({ authentication: undefined }).one(),
}));
jest.mock('utils/errors/handle');
jest.mock('widgets/UserLogin', () => ({
  __esModule: true,
  default: () => 'user login component rendered',
}));

jest.mock('widgets/RootSearchSuggestField', () => ({
  __esModule: true,
  default: ({ exampleProp }: { exampleProp: string }) =>
    `root search suggest field component rendered with ${exampleProp}`,
}));

jest.mock('contexts/SessionContext', () => ({
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
    render(<Root richieReactSpots={[userLoginContainer, rootSearchSuggestFieldContainer]} />, {
      wrapper: IntlWrapper,
    });

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
    render(<Root richieReactSpots={[userFeedbackContainer, userLoginContainer]} />, {
      wrapper: IntlWrapper,
    });

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
    jest.doMock('widgets/Search', () => {
      throw Error('Failed to render Search component.');
    });
    const searchFailingComponent = document.createElement('div');
    searchFailingComponent.setAttribute('class', 'richie-react richie-react--search');
    document.body.append(searchFailingComponent);

    // Render the root component, passing our real element and our bogus one
    render(<Root richieReactSpots={[userLoginContainer, searchFailingComponent]} />, {
      wrapper: IntlWrapper,
    });

    await findByText(userLoginContainer, 'user login component rendered');
    expect(mockHandle).toHaveBeenCalledWith(new Error('Failed to render Search component.'));
  });
});
