import { render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import {
  LtiConsumerContentParameters as LtiConsumerContentParametersProps,
  LtiConsumer as LtiConsumerProps,
} from 'types/LtiConsumer';
import { LtiConsumer } from '.';

describe('components/LtiConsumer', () => {
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
    } as LtiConsumerContentParametersProps;

    const ltiConsumerProps = {
      url: 'http://localhost:8060/lti/videos/c761d6e9-5371-4650-b27a-fa4c8865fd34',
      content_parameters: contentParameters,
      automatic_resizing: true,
    } as LtiConsumerProps;

    // As HTMLFormElement doesn't implement submit (see https://github.com/jsdom/jsdom/issues/1937),
    // we need to fake iframe content loading
    HTMLFormElement.prototype.submit = () => {
      const iframeDocument = document.getElementsByTagName('iframe')[0].contentDocument!;
      iframeDocument.open();
      iframeDocument.write(
        `<!DOCTYPE html><html lang=""><body>
          <p style="height: 400px;">It works !!</p>
         </body></html>,`,
      );
      iframeDocument.close();
    };

    const { container } = render(
      <IntlProvider locale="en">
        <LtiConsumer {...ltiConsumerProps} />
      </IntlProvider>,
    );

    // check form inputs
    Object.entries(ltiConsumerProps.content_parameters).forEach(([name, value]) => {
      const input = container.querySelector(`input[name=${name}]`);
      expect(input).toBeInstanceOf(HTMLInputElement);
      if (input) {
        expect(input.getAttribute('value')).toEqual(value);
      }
    });

    // check if iframeresizer does its job
    const iframe: HTMLIFrameElement = container.getElementsByTagName('iframe')[0];
    expect(iframe.id).toMatch(/^iFrameResizer[0-9]$/);
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
    } as LtiConsumerContentParametersProps;

    const ltiConsumerProps = {
      url: 'http://localhost:8060/lti/videos/c761d6e9-5371-4650-b27a-fa4c8865fd34',
      content_parameters: contentParameters,
      automatic_resizing: false,
    } as LtiConsumerProps;

    // As HTMLFormElement doesn't implement submit (see https://github.com/jsdom/jsdom/issues/1937),
    // we need to fake iframe content loading
    HTMLFormElement.prototype.submit = () => {
      const iframeDocument = document.getElementsByTagName('iframe')[0].contentDocument!;
      iframeDocument.open();
      iframeDocument.write(
        `<!DOCTYPE html><html lang=""><body>
          <p style="height: 400px;">It works !!</p>
         </body></html>,`,
      );
      iframeDocument.close();
    };

    const { container } = render(
      <IntlProvider locale="en">
        <LtiConsumer {...ltiConsumerProps} />
      </IntlProvider>,
    );

    // check form inputs
    Object.entries(ltiConsumerProps.content_parameters).forEach(([name, value]) => {
      const input = container.querySelector(`input[name=${name}]`);
      expect(input).toBeInstanceOf(HTMLInputElement);
      if (input) {
        expect(input.getAttribute('value')).toEqual(value);
      }
    });

    // check if iframeresizer does its job
    const iframe: HTMLIFrameElement = container.getElementsByTagName('iframe')[0];
    expect(iframe.id).not.toMatch(/^iFrameResizer[0-9]$/);
  });
});
