import { type PropsWithChildren } from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { QueryClient, QueryClientProvider, QueryObserverOptions } from '@tanstack/react-query';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { Deferred } from 'utils/test/deferred';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
import { RICHIE_LTI_ANONYMOUS_USER_ID_CACHE_KEY } from 'settings';
import { handle } from 'utils/errors/handle';
import { resolveAll } from 'utils/resolveAll';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { noop } from 'utils';
import { useSession } from 'contexts/SessionContext';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';
import {
  LtiConsumerContentParameters,
  LtiConsumerContext,
  LtiConsumerProps,
} from './types/LtiConsumer';
import LtiConsumer from '.';

const mockHandle: jest.Mock<typeof handle> = handle as any;
jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory().one(),
}));
jest.mock('uuid', () => ({
  v4: () => 'a-random-uuid',
}));

describe('widgets/LtiConsumer', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
    sessionStorage.clear();
    delete window.CMS;
  });

  // As HTMLFormElement doesn't implement submit (see https://github.com/jsdom/jsdom/issues/1937),
  // we need to fake iframe content loading
  const mockSubmit = jest.fn(() => {
    const iframeDocument = document.getElementsByTagName('iframe')[0].contentDocument!;
    iframeDocument.open();
    iframeDocument.write(
      `<!DOCTYPE html><html lang=""><body>
          <p style="height: 400px;">It works !!</p>
         </body></html>,`,
    );
    iframeDocument.close();
  });
  HTMLFormElement.prototype.submit = mockSubmit;

  const Wrapper = ({ client, children }: PropsWithChildren<{ client: QueryClient }>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={client}>
        <BaseSessionProvider>{children}</BaseSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  it('renders an auto-resized iframe with a LTI content', async () => {
    const contentParameters = {
      lti_message_type: 'Marsha Video',
      lti_version: 'LTI-1p0',
      resource_link_id: '1',
      context_id: 'coursecode1',
      user_id: 'richie',
      lis_person_contact_email_primary: '',
      roles: 'instructor',
      oauth_consumer_key: 'InsecureOauthConsumerKey',
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: '1378916897',
      oauth_nonce: '80966668944732164491378916897',
      oauth_version: '1.0',
      oauth_signature: 'frVp4JuvT1mVXlxktiAUjQ7/1cw=',
    } as LtiConsumerContentParameters;

    const ltiContextResponse: LtiConsumerContext = {
      url: 'http://localhost:8060/lti/videos/c761d6e9-5371-4650-b27a-fa4c8865fd34',
      content_parameters: contentParameters,
      is_automatic_resizing: true,
    };

    const ltiConsumerProps = {
      id: 1337,
    } as LtiConsumerProps;

    const ltiContextDeferred = new Deferred();
    fetchMock.get(
      '/api/v1.0/plugins/lti-consumer/1337/context/?user_id=a-random-uuid',
      ltiContextDeferred.promise,
    );

    const { container } = render(
      <Wrapper client={createTestQueryClient({ user: null })}>
        <LtiConsumer {...ltiConsumerProps} />
      </Wrapper>,
    );

    await act(async () => ltiContextDeferred.resolve(ltiContextResponse));

    // check form inputs
    await resolveAll(
      Object.entries(ltiContextResponse.content_parameters),
      async ([name, value]) => {
        await waitFor(() => {
          const input = container.querySelector(`input[name=${name}]`);
          expect(input).toBeInstanceOf(HTMLInputElement);
          if (input) {
            expect(input.getAttribute('value')).toEqual(value);
          }
        });
      },
    );

    // check if iframeresizer does its job
    const iframe: HTMLIFrameElement = container.getElementsByTagName('iframe')[0];
    const form: HTMLFormElement = container.getElementsByTagName('form')[0];
    expect(iframe.id).toMatch(/^iFrameResizer[0-9]$/);
    expect(form.submit).toHaveBeenCalledTimes(1);

    // Check that iframe name relies on resource id to be unique
    expect(iframe.name).toEqual('lti_iframe_1337');
    // Check that form target the iframe
    expect(form.target).toEqual(iframe.name);
  });

  it('renders an iframe with a LTI content', async () => {
    const contentParameters = {
      lti_message_type: 'Marsha Video',
      lti_version: 'LTI-1p0',
      resource_link_id: '1',
      context_id: 'coursecode1',
      user_id: 'richie',
      lis_person_contact_email_primary: '',
      roles: 'instructor',
      oauth_consumer_key: 'InsecureOauthConsumerKey',
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: '1378916897',
      oauth_nonce: '80966668944732164491378916897',
      oauth_version: '1.0',
      oauth_signature: 'frVp4JuvT1mVXlxktiAUjQ7/1cw=',
    } as LtiConsumerContentParameters;

    const ltiContextResponse: LtiConsumerContext = {
      url: 'http://localhost:8060/lti/videos/c761d6e9-5371-4650-b27a-fa4c8865fd34',
      content_parameters: contentParameters,
      is_automatic_resizing: false,
    };

    const ltiConsumerProps = {
      id: 1337,
    } as LtiConsumerProps;

    const ltiContextDeferred = new Deferred();
    fetchMock.get(
      '/api/v1.0/plugins/lti-consumer/1337/context/?user_id=a-random-uuid',
      ltiContextDeferred.promise,
    );

    const { container } = render(
      <Wrapper client={createTestQueryClient({ user: null })}>
        <LtiConsumer {...ltiConsumerProps} />
      </Wrapper>,
    );

    await act(async () => ltiContextDeferred.resolve(ltiContextResponse));

    // check form inputs
    await resolveAll(
      Object.entries(ltiContextResponse.content_parameters),
      async ([name, value]) => {
        await waitFor(() => {
          const input = container.querySelector(`input[name=${name}]`);
          expect(input).toBeInstanceOf(HTMLInputElement);
          expect(input!.getAttribute('value')).toEqual(value);
        });
      },
    );

    // check if iframeresizer does its job
    const iframe: HTMLIFrameElement = container.getElementsByTagName('iframe')[0];
    const form: HTMLFormElement = container.getElementsByTagName('form')[0];
    expect(iframe.id).not.toMatch(/^iFrameResizer[0-9]$/);
    expect(form.submit).toHaveBeenCalledTimes(1);

    // Check that iframe name relies on resource id to be unique
    expect(iframe.name).toEqual('lti_iframe_1337');
    // Check that form target the iframe
    expect(form.target).toEqual(iframe.name);
  });

  it('renders nothing and handle error if context fetching failed', async () => {
    const ltiConsumerProps = {
      id: 1337,
    } as LtiConsumerProps;

    fetchMock.get(
      '/api/v1.0/plugins/lti-consumer/1337/context/?user_id=a-random-uuid',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );

    const { container } = render(
      <Wrapper client={createTestQueryClient({ user: null })}>
        <LtiConsumer {...ltiConsumerProps} />
      </Wrapper>,
    );

    await waitFor(() =>
      expect(mockHandle).toHaveBeenCalledWith(new HttpError(500, 'Internal Server Error')),
    );

    // Nothing has been rendered
    const iframe: HTMLIFrameElement = container.getElementsByTagName('iframe')[0];
    const form: HTMLFormElement = container.getElementsByTagName('form')[0];
    expect(iframe).toBeUndefined();
    expect(form).toBeUndefined();
  });

  it('uses user information when user is authenticated', () => {
    const ltiContextDeferred = new Deferred();
    fetchMock.get('/api/v1.0/plugins/lti-consumer/1337/context/', ltiContextDeferred.promise, {
      query: {
        lis_person_contact_email_primary: 'johndoe@example.com',
        lis_person_name_given: 'johndoe',
        lis_person_sourcedid: 'johndoe',
        user_id: 'johndoe',
      },
    });

    render(
      <Wrapper
        client={createTestQueryClient({
          user: { username: 'johndoe', email: 'johndoe@example.com' },
        })}
      >
        <LtiConsumer id={1337} />
      </Wrapper>,
    );

    expect(fetchMock.calls()).toHaveLength(1);
    expect(
      fetchMock.lastCall(/api\/v1.0\/plugins\/lti-consumer\/1337\/context\//, {
        method: 'GET',
        query: {
          lis_person_contact_email_primary: 'johndoe@example.com',
          lis_person_name_given: 'johndoe',
          lis_person_sourcedid: 'johndoe',
          user_id: 'johndoe',
        },
      }),
    ).toBeDefined();
    expect(sessionStorage.getItem(RICHIE_LTI_ANONYMOUS_USER_ID_CACHE_KEY)).toBeNull();
  });

  it('uses a random uuid as user_id when user is not authenticated', () => {
    const ltiContextDeferred = new Deferred();
    fetchMock.get(
      '/api/v1.0/plugins/lti-consumer/1337/context/?user_id=a-random-uuid',
      ltiContextDeferred.promise,
    );

    render(
      <Wrapper client={createTestQueryClient({ user: null })}>
        <LtiConsumer id={1337} />
      </Wrapper>,
    );

    expect(fetchMock.calls()).toHaveLength(1);
    expect(
      fetchMock.lastCall(/api\/v1.0\/plugins\/lti-consumer\/1337\/context\//, {
        method: 'GET',
        query: {
          user_id: 'a-random-uuid',
        },
      }),
    ).toBeDefined();
    expect(sessionStorage.getItem(RICHIE_LTI_ANONYMOUS_USER_ID_CACHE_KEY)).toBe('a-random-uuid');
  });

  it('sets stale time to 0 in editor mode', async () => {
    window.CMS = {
      config: {
        auth: true,
      },
      Plugin: {
        _initializeTree: noop,
      },
    };

    const ltiContextDeferred = new Deferred();
    fetchMock.get(
      '/api/v1.0/plugins/lti-consumer/1337/context/?user_id=a-random-uuid',
      ltiContextDeferred.promise,
    );
    const client = createTestQueryClient({ user: null });

    render(
      <Wrapper client={client}>
        <LtiConsumer id={1337} />
      </Wrapper>,
    );

    await act(async () =>
      ltiContextDeferred.resolve({
        url: 'http://localhost:8060/lti/videos/c761d6e9-5371-4650-b27a-fa4c8865fd34',
        content_parameters: {
          lti_message_type: 'Marsha Video',
          lti_version: 'LTI-1p0',
          resource_link_id: '1',
          context_id: 'coursecode1',
          user_id: 'richie',
          lis_person_contact_email_primary: '',
          roles: 'instructor',
          oauth_consumer_key: 'InsecureOauthConsumerKey',
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: '1378916897',
          oauth_nonce: '80966668944732164491378916897',
          oauth_version: '1.0',
          oauth_signature: 'frVp4JuvT1mVXlxktiAUjQ7/1cw=',
        },
        is_automatic_resizing: true,
      }),
    );

    const cacheQueries = client.getQueryCache().getAll();

    expect(
      cacheQueries.find(
        (query) =>
          query.queryKey.includes('lti-consumer-plugin-1337') &&
          (query.options as QueryObserverOptions).staleTime === 0,
      ),
    ).toBeDefined();
  });

  it('does not refetch context on user update', async () => {
    const user = UserFactory({ username: 'johndoe', email: undefined }).one();
    const client = createTestQueryClient({ user });
    fetchMock.get('https://endpoint.test/logout', 200);
    fetchMock.get(
      '/api/v1.0/plugins/lti-consumer/1337/context/?lis_person_name_given=johndoe&lis_person_sourcedid=johndoe&user_id=johndoe',
      {
        url: 'http://localhost:8060/lti/videos/c761d6e9-5371-4650-b27a-fa4c8865fd34',
        content_parameters: {
          lti_message_type: 'Marsha Video',
          lti_version: 'LTI-1p0',
          resource_link_id: '1',
          context_id: 'coursecode1',
          user_id: 'richie',
          lis_person_contact_email_primary: '',
          roles: 'instructor',
          oauth_consumer_key: 'InsecureOauthConsumerKey',
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: '1378916897',
          oauth_nonce: '80966668944732164491378916897',
          oauth_version: '1.0',
          oauth_signature: 'frVp4JuvT1mVXlxktiAUjQ7/1cw=',
        },
        is_automatic_resizing: true,
      },
    );

    const { result } = renderHook(useSession, {
      wrapper: ({ children }: PropsWithChildren) => (
        <Wrapper client={client}>
          <LtiConsumer id={1337} />
          {children}
        </Wrapper>
      ),
    });

    expect(result.current.user?.username).toBe('johndoe');
    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastUrl()).toBe(
      '/api/v1.0/plugins/lti-consumer/1337/context/?lis_person_name_given=johndoe&lis_person_sourcedid=johndoe&user_id=johndoe',
    );

    // User logout
    await act(async () => {
      result.current.destroy();
    });

    expect(fetchMock.calls()).toHaveLength(2);
    expect(fetchMock.lastUrl()).toBe('https://endpoint.test/logout');

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });

    // Once LTIConsumer component has been rerenred, it should not have been refetched context
    expect(fetchMock.calls()).toHaveLength(2);
  });
});
