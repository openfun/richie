import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';

const messages = defineMessages({
  closeLabel: {
    defaultMessage: 'Close',
    description:
      'Accessibility label for the "x" disable icon on an active filer',
    id: 'components.CloseIcon.closeLabel',
  },
});

export const CloseIcon = injectIntl(({ intl }: InjectedIntlProps) => (
  <svg
    aria-label={intl.formatMessage(messages.closeLabel)}
    className="icon-close"
    viewBox="0 0 100 100"
  >
    <path d="M 12,12 L 88,88 M 88,12 L 12,88" />
  </svg>
));
