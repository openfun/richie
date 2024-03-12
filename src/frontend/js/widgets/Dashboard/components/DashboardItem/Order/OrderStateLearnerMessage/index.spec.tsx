import React, { PropsWithChildren } from 'react';
import { screen } from '@testing-library/react';
import { createIntl } from 'react-intl';
import {
  ContractDefinitionFactory,
  ContractFactory,
  CredentialOrderFactory,
} from 'utils/test/factories/joanie';
import { OrderState } from 'types/Joanie';
import { render } from 'utils/test/render';
import { IntlWrapper } from 'utils/test/wrappers/IntlWrapper';
import OrderStateLearnerMessage, { messages } from '.';

const intl = createIntl({ locale: 'en' });

describe('<DashboardItemOrder/>', () => {
  it.each([
    [OrderState.DRAFT, 'Draft'],
    [OrderState.SUBMITTED, 'Submitted'],
    [OrderState.PENDING, 'Pending'],
    [OrderState.CANCELED, 'Canceled'],
  ])(
    'should display message from order state: %s when order have no contract',
    (state, expectedMessage) => {
      const order = CredentialOrderFactory({ state }).one();
      render(<OrderStateLearnerMessage order={order} />, {
        wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
      });
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
      const orderWithContract = CredentialOrderFactory({
        state,
        contract: ContractFactory().one(),
      }).one();
      render(<OrderStateLearnerMessage order={orderWithContract} />, {
        wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
      });
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    },
  );

  it('should display message for validated order that need learner signature', () => {
    const order = CredentialOrderFactory({
      state: OrderState.VALIDATED,
      contract: null,
    }).one();

    const contractDefinition = ContractDefinitionFactory().one();

    render(<OrderStateLearnerMessage order={order} contractDefinition={contractDefinition} />, {
      wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
    });
    expect(screen.getByText('Signature required')).toBeInTheDocument();
  });

  it("should display message for validated order that don't have a generated certificate", () => {
    const order = CredentialOrderFactory({
      state: OrderState.VALIDATED,
      contract: ContractFactory({ student_signed_on: new Date().toISOString() }).one(),
      certificate_id: undefined,
    }).one();
    render(<OrderStateLearnerMessage order={order} />, {
      wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
    });
    expect(
      screen.getByText(intl.formatMessage(messages.statusOnGoing), {
        exact: false,
      }),
    );
  });

  it('should display message for validated order that have a generated certificate', () => {
    const order = CredentialOrderFactory({
      state: OrderState.VALIDATED,
      contract: ContractFactory({
        student_signed_on: new Date().toISOString(),
        organization_signed_on: new Date().toISOString(),
      }).one(),
      certificate_id: 'FAKE_CERTIFICATE_ID',
    }).one();
    render(<OrderStateLearnerMessage order={order} />, {
      wrapper: ({ children }: PropsWithChildren) => <IntlWrapper>{children}</IntlWrapper>,
    });
    expect(
      screen.getByText(intl.formatMessage(messages.statusCompleted), {
        exact: false,
      }),
    );
  });
});
