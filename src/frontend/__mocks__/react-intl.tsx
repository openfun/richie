import * as React from 'react';
import { FormattedDate, FormattedMessage, Messages } from 'react-intl';

const Intl: any = jest.genMockFromModule('react-intl');

// Make a defineMessage implementation that just returns the messages (so they can be reused at the call site)
Intl.defineMessages.mockImplementation((messages: Messages) => messages);

// intl context that will be injected into components by injectIntl
const intl = {
  formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
    defaultMessage,
};

// Patch injectIntl to do the context injecting
Intl.injectIntl = (Node: any) => {
  const renderWrapped: any = (props: any) => <Node {...props} intl={intl} />;
  renderWrapped.displayName = Node.displayName || Node.name || 'Component';
  return renderWrapped;
};

// Patch FormattedMessage to just spit out the default message
Intl.FormattedMessage = jest
  .fn()
  .mockImplementation((props: FormattedMessage.Props) => props.defaultMessage);

// FormattedDate returns the value as-is
Intl.FormattedDate = jest
  .fn()
  .mockImplementation((props: FormattedDate.Props) => props.value);

module.exports = Intl;
