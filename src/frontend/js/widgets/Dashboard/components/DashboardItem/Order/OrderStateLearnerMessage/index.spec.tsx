import React, { PropsWithChildren } from 'react';
import { screen } from '@testing-library/react';
import { createIntl } from 'react-intl';
import { CredentialOrderFactory } from 'utils/test/factories/joanie';
import { OrderState } from 'types/Joanie';
import { render } from 'utils/test/render';
import { IntlWrapper } from 'utils/test/wrappers/IntlWrapper';
import OrderStateLearnerMessage, { messages } from '.';

const intl = createIntl({ locale: 'en' });

describe('<OrderStateLearnerMessage/>', () => {
  it.each([
    [OrderState.ASSIGNED, 'Pending'],
    [OrderState.CANCELED, 'Canceled'],
    [OrderState.COMPLETED, 'On going'],
    [OrderState.DRAFT, 'Pending'],
    [OrderState.FAILED_PAYMENT, 'Last direct debit has failed'],
    [OrderState.NO_PAYMENT, 'First direct debit has failed'],
    [OrderState.PENDING, 'Pending for the first direct debit'],
    [OrderState.PENDING_PAYMENT, 'On going'],
    [OrderState.SIGNING, 'Signature required'],
    [OrderState.TO_SAVE_PAYMENT_METHOD, 'Payment method is missing'],
    [OrderState.TO_SIGN, 'Signature required'],
  ])('should display message from order state: %s', (state, expectedMessage) => {
    const order = CredentialOrderFactory({ state }).one();
    render(<OrderStateLearnerMessage order={order} />, {
      wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
    });
    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  });

  it('should display message for completed order that have a generated certificate', () => {
    const order = CredentialOrderFactory({
      state: OrderState.COMPLETED,
      certificate_id: 'FAKE_CERTIFICATE_ID',
    }).one();
    render(<OrderStateLearnerMessage order={order} />, {
      wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
    });
    expect(
      screen.getByText(intl.formatMessage(messages.statusPassed), {
        exact: false,
      }),
    );
  });
});
