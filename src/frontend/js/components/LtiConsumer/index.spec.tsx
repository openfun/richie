import { act, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';

import { Deferred } from 'utils/test/deferred';
import {
  LtiConsumerContentParameters,
  LtiConsumerContext,
  LtiConsumerProps,
} from 'types/LtiConsumer';
import { handle } from 'utils/errors/handle';
import LtiConsumer from '.';

const mockHandle: jest.Mock<typeof handle> = handle as any;
jest.mock('utils/errors/handle');
jest.mock('utils/context', () => jest.fn());

describe('components/LtiConsumer', () => {
  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
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
    fetchMock.get('/api/v1.0/plugins/lti-consumer/1337/context/', ltiContextDeferred.promise);

    const { container } = render(
      <IntlProvider locale="en">
        <LtiConsumer {...ltiConsumerProps} />
      </IntlProvider>,
    );

    await act(async () => ltiContextDeferred.resolve(ltiContextResponse));

    // check form inputs
    Object.entries(ltiContextResponse.content_parameters).forEach(([name, value]) => {
      const input = container.querySelector(`input[name=${name}]`);
      expect(input).toBeInstanceOf(HTMLInputElement);
      if (input) {
        expect(input.getAttribute('value')).toEqual(value);
      }
    });

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
    fetchMock.get('/api/v1.0/plugins/lti-consumer/1337/context/', ltiContextDeferred.promise);

    const { container } = render(
      <IntlProvider locale="en">
        <LtiConsumer {...ltiConsumerProps} />
      </IntlProvider>,
    );

    await act(async () => ltiContextDeferred.resolve(ltiContextResponse));

    // check form inputs
    Object.entries(ltiContextResponse.content_parameters).forEach(([name, value]) => {
      const input = container.querySelector(`input[name=${name}]`);
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input!.getAttribute('value')).toEqual(value);
    });

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

    const ltiContextDeferred = new Deferred();
    fetchMock.get('/api/v1.0/plugins/lti-consumer/1337/context/', ltiContextDeferred.promise);

    const { container } = render(
      <IntlProvider locale="en">
        <LtiConsumer {...ltiConsumerProps} />
      </IntlProvider>,
    );

    await act(async () => ltiContextDeferred.resolve(500));

    expect(mockHandle).toHaveBeenCalledWith(
      Error('Failed to retrieve LTI consumer context at placeholder 1337'),
    );

    // Nothing has been rendered
    const iframe: HTMLIFrameElement = container.getElementsByTagName('iframe')[0];
    const form: HTMLFormElement = container.getElementsByTagName('form')[0];
    expect(iframe).toBeUndefined();
    expect(form).toBeUndefined();
  });
});
