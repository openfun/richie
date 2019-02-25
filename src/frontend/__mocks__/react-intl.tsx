import * as React from 'react';
import {
  FormattedDate as RealFormattedDate,
  FormattedMessage as RealFormattedMessage,
  Messages,
} from 'react-intl';

const Intl: any = jest.genMockFromModule('react-intl');

// Make a defineMessage implementation that just returns the messages (so they can be reused at the call site)
export const defineMessages = jest
  .fn()
  .mockImplementation((messages: Messages) => messages);

// intl context that will be injected into components by injectIntl
const intl = {
  formatMessage: ({ defaultMessage }: { defaultMessage: string }) =>
    defaultMessage,
};

// Patch injectIntl to do the context injecting
export const injectIntl = (Node: any) => {
  const renderWrapped: any = (props: any) => <Node {...props} intl={intl} />;
  renderWrapped.displayName = Node.displayName || Node.name || 'Component';
  return renderWrapped;
};

// Patch FormattedMessage to just spit out the default message
export const FormattedMessage = jest
  .fn()
  .mockImplementation(
    (props: RealFormattedMessage.Props) => props.defaultMessage,
  );

// FormattedDate returns the value as-is
export const FormattedDate = jest
  .fn()
  .mockImplementation((props: RealFormattedDate.Props) => props.value);
