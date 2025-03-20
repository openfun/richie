import { PropsWithChildren } from 'react';
import { act, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { userEvent } from '@testing-library/user-event';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import OpenEdxFullNameForm from 'components/OpenEdxFullNameForm/index';
import { SaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { SaleTunnelContextFactory } from 'utils/test/factories/joanie';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { AppWrapperProps } from 'utils/test/wrappers/types';
import { expectAlertError, expectAlertWarning, expectNoAlertWarning } from 'utils/test/expectAlert';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/errors/handle', () => ({
  handle: jest.fn(),
}));

describe('OpenEdxFullNameForm', () => {
  let submitCallbacks: Record<PropertyKey, () => Promise<void>> = {};
  const Wrapper = ({ children, ...props }: PropsWithChildren<AppWrapperProps>) => (
    <BaseJoanieAppWrapper {...props}>
      <SaleTunnelContext.Provider
        value={SaleTunnelContextFactory({
          registerSubmitCallback: (key: string, callback: () => Promise<void>) => {
            submitCallbacks[key] = callback;
          },
        }).one()}
      >
        {children}
      </SaleTunnelContext.Provider>
      ,
    </BaseJoanieAppWrapper>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
    submitCallbacks = {};
  });
  setupJoanieSession();

  it('should not populate form with username', async () => {
    const user = UserFactory({ full_name: '' }).one();
    const queryClient = createTestQueryClient({ user });
    const { 'pref-lang': prefLang, ...profile } = OpenEdxApiProfileFactory({
      name: user.full_name,
      username: user.username,
      email: user.email,
    }).one();
    fetchMock.get(`https://auth.test/api/user/v1/accounts/${user.username}`, profile);
    fetchMock.get(`https://auth.test/api/user/v1/preferences/${user.username}`, {
      'pref-lang': prefLang,
    });

    render(<OpenEdxFullNameForm />, {
      queryOptions: { client: queryClient },
      wrapper: Wrapper,
    });

    const $input = await screen.findByRole('textbox', { name: 'First name and last name' });
    expect($input).toHaveValue('');
  });

  it('should populate form with existing full name', async () => {
    const user = UserFactory().one();
    const queryClient = createTestQueryClient({ user });
    const { 'pref-lang': prefLang, ...profile } = OpenEdxApiProfileFactory({
      name: user.full_name,
      username: user.username,
      email: user.email,
    }).one();
    fetchMock.get(`https://auth.test/api/user/v1/accounts/${user.username}`, profile);
    fetchMock.get(`https://auth.test/api/user/v1/preferences/${user.username}`, {
      'pref-lang': prefLang,
    });

    render(<OpenEdxFullNameForm />, {
      queryOptions: { client: queryClient },
      wrapper: Wrapper,
    });

    const $input = await screen.findByRole('textbox', { name: 'First name and last name' });
    expect($input).toHaveValue(user.full_name);
  });

  it('should require a value to submit the form', async () => {
    const user = UserFactory({ full_name: '' }).one();
    const queryClient = createTestQueryClient({ user });
    const { 'pref-lang': prefLang, ...profile } = OpenEdxApiProfileFactory({
      name: user.full_name,
      username: user.username,
      email: user.email,
    }).one();
    fetchMock.get(`https://auth.test/api/user/v1/accounts/${user.username}`, profile);
    fetchMock.get(`https://auth.test/api/user/v1/preferences/${user.username}`, {
      'pref-lang': prefLang,
    });

    expect(submitCallbacks).toEqual({});

    render(<OpenEdxFullNameForm />, {
      queryOptions: { client: queryClient },
      wrapper: Wrapper,
    });

    expect(submitCallbacks.hasOwnProperty('openEdxFullNameForm')).toBe(true);

    const $input = await screen.findByRole('textbox', { name: 'First name and last name' });
    expect($input).toHaveValue('');

    await expectAlertWarning(
      'Please check that your first name and last name are correct. They will be used on official document (e.g: certificate, contract, etc.)',
    );

    // Submit the form
    await act(async () => {
      await expect(submitCallbacks.openEdxFullNameForm()).rejects.not.toBeUndefined();
    });

    screen.getByText('This field is required.');
    await expectNoAlertWarning(
      'Please check that your first name and last name are correct. They will be used on official document (e.g: certificate, contract, etc.)',
    );
    await expectAlertError(
      'Please check that your first name and last name are correct. They will be used on official document (e.g: certificate, contract, etc.)',
    );
  });

  it('should require a value with at least 3 chars to submit the form', async () => {
    const user = UserFactory({ full_name: '' }).one();
    const queryClient = createTestQueryClient({ user });
    const { 'pref-lang': prefLang, ...profile } = OpenEdxApiProfileFactory({
      name: user.full_name,
      username: user.username,
      email: user.email,
    }).one();
    fetchMock.get(`https://auth.test/api/user/v1/accounts/${user.username}`, profile);
    fetchMock.get(`https://auth.test/api/user/v1/preferences/${user.username}`, {
      'pref-lang': prefLang,
    });

    expect(submitCallbacks).toEqual({});

    render(<OpenEdxFullNameForm />, {
      queryOptions: { client: queryClient },
      wrapper: Wrapper,
    });

    expect(submitCallbacks.hasOwnProperty('openEdxFullNameForm')).toBe(true);

    const $input = await screen.findByRole('textbox', { name: 'First name and last name' });
    expect($input).toHaveValue('');

    const eventHandler = userEvent.setup();
    await eventHandler.type($input, 'Jo');

    // Submit the form
    await act(async () => {
      await expect(submitCallbacks.openEdxFullNameForm()).rejects.not.toBeUndefined();
    });

    screen.getByText('The minimum length is 3 chars.');
  });

  it('should submit the form', async () => {
    const user = UserFactory({ full_name: '' }).one();
    const queryClient = createTestQueryClient({ user });
    const { 'pref-lang': prefLang, ...profile } = OpenEdxApiProfileFactory({
      name: user.full_name,
      username: user.username,
      email: user.email,
    }).one();
    fetchMock
      .get(`https://auth.test/api/user/v1/accounts/${user.username}`, profile)
      .get(`https://auth.test/api/user/v1/preferences/${user.username}`, {
        'pref-lang': prefLang,
      });

    expect(submitCallbacks).toEqual({});

    render(<OpenEdxFullNameForm />, {
      queryOptions: { client: queryClient },
      wrapper: Wrapper,
    });

    expect(submitCallbacks.hasOwnProperty('openEdxFullNameForm')).toBe(true);

    const $input = await screen.findByRole('textbox', { name: 'First name and last name' });
    expect($input).toHaveValue('');

    const eventHandler = userEvent.setup();
    await eventHandler.type($input, 'John Doe');

    // Submit the form
    fetchMock
      .patch(`https://auth.test/api/user/v1/accounts/${user.username}`, 200)
      .patch(`https://auth.test/api/user/v1/preferences/${user.username}`, 200)
      .get('https://auth.test/api/v1.0/user/me', { ...user, full_name: 'John Doe' })
      .get(
        `https://auth.test/api/user/v1/accounts/JohnDoe`,
        { ...profile, name: 'John Doe' },
        { overwriteRoutes: true },
      );

    await act(async () => {
      await submitCallbacks.openEdxFullNameForm();
    });

    expect($input).toHaveValue('John Doe');
  });

  it('should display error if request to retrieve account fails', async () => {
    const user = UserFactory().one();
    const queryClient = createTestQueryClient({ user });
    fetchMock.get(`https://auth.test/api/user/v1/accounts/${user.username}`, 500);
    fetchMock.get(`https://auth.test/api/user/v1/preferences/${user.username}`, 500);

    render(<OpenEdxFullNameForm />, {
      queryOptions: { client: queryClient },
      wrapper: Wrapper,
    });

    await expectAlertError('An error occurred while fetching your profile. Please retry later.');
  });
});
