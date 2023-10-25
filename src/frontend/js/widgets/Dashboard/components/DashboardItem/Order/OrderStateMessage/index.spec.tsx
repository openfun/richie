import React, { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider, createIntl } from 'react-intl';
import { ContractFactory, OrderFactory } from 'utils/test/factories/joanie';
import { OrderState } from 'types/Joanie';
import OrderStateMessage, { messages } from '.';

const intl = createIntl({ locale: 'en' });

/*
  @TODO (rlecellier): Rewrite everything with these guidlignes
  Order lifecycle:
    * Draft: order has been created
    * Submitted: order information have been validated
    * Pending: payment has failed but can be retried
    * Validated:
        * Completed (Validated with generated certificate)
        * On going (Validated without generated certificate)
        * Signature needed: !order.product.contract.isSign
    * Canceled: has been canceled
*/
describe('<DashboardItemOrder/>', () => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">{children}</IntlProvider>
  );

  it.each([
    [OrderState.DRAFT, 'Draft'],
    [OrderState.SUBMITTED, 'Submitted'],
    [OrderState.PENDING, 'Pending'],
    [OrderState.CANCELED, 'Canceled'],
  ])(
    'should display message from order state: %s when order have no contract',
    (state, expectedMessage) => {
      const order = OrderFactory({ state }).one();
      render(
        <Wrapper>
          <OrderStateMessage order={order} />
        </Wrapper>,
      );
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    },
  );

  it.each([
    [OrderState.DRAFT, 'Draft'],
    [OrderState.SUBMITTED, 'Submitted'],
    [OrderState.PENDING, 'Pending'],
    [OrderState.CANCELED, 'Canceled'],
  ])(
    'should display message from order state: %s when order have no contract',
    (state, expectedMessage) => {
      const orderWithContract = OrderFactory({
        state,
        contract: ContractFactory().one(),
      }).one();
      render(
        <Wrapper>
          <OrderStateMessage order={orderWithContract} />
        </Wrapper>,
      );
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    },
  );

  it('should display message for validated order that need learner signature', () => {
    const order = OrderFactory({
      state: OrderState.VALIDATED,
      contract: ContractFactory({ signed_on: undefined }).one(),
    }).one();
    render(
      <Wrapper>
        <OrderStateMessage order={order} />
      </Wrapper>,
    );
    expect(screen.getByText('Signature required')).toBeInTheDocument();
  });

  it("should display message for validated order that don't have a generated certificate", () => {
    const order = OrderFactory({
      state: OrderState.VALIDATED,
      contract: ContractFactory({ signed_on: new Date().toISOString() }).one(),
      certificate: undefined,
    }).one();
    render(
      <Wrapper>
        <OrderStateMessage order={order} />
      </Wrapper>,
    );
    expect(
      screen.getByText(intl.formatMessage(messages.statusOnGoing), {
        exact: false,
      }),
    );
  });

  it('should display message for validated order that have a generated certificate', () => {
    const order = OrderFactory({
      state: OrderState.VALIDATED,
      contract: ContractFactory({ signed_on: new Date().toISOString() }).one(),
      certificate: 'FAKE_CERTIFICATE_ID',
    }).one();
    render(
      <Wrapper>
        <OrderStateMessage order={order} />
      </Wrapper>,
    );
    expect(
      screen.getByText(intl.formatMessage(messages.statusCompleted), {
        exact: false,
      }),
    );
  });
});
