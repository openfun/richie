import { screen, within } from '@testing-library/react';
import { useMemo, useState } from 'react';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import {
  SaleTunnelStep,
  SaleTunnelV2Context,
  SaleTunnelV2ContextType,
} from 'components/SaleTunnelV2/GenericSaleTunnel';
import { Address, CreditCard } from 'types/Joanie';
import { CredentialOrderFactory, ProductFactory } from 'utils/test/factories/joanie';
import { SaleTunnelV2Props } from 'components/SaleTunnelV2/index';
import { CreditCardSelector } from 'components/SaleTunnelV2/CreditCardSelector';
import { AddressSelector } from 'components/SaleTunnelV2/AddressSelector/index';
import { render } from 'utils/test/render';

describe('AddressSelector', () => {
  setupJoanieSession();

  const buildWrapper = () => {
    const contextRef = {
      current: {} as SaleTunnelV2ContextType,
    };

    const Wrapper = () => {
      const [billingAddress, setBillingAddress] = useState<Address>();
      const context: SaleTunnelV2ContextType = useMemo(
        () => ({
          eventKey: 'eventKey',
          order: CredentialOrderFactory().one(),
          product: ProductFactory().one(),
          props: {} as SaleTunnelV2Props,
          billingAddress,
          setBillingAddress,
          setCreditCard: jest.fn(),
          onPaymentSuccess: jest.fn(),
          step: SaleTunnelStep.PAYMENT,
        }),
        [billingAddress],
      );
      contextRef.current = context;

      return (
        <SaleTunnelV2Context.Provider value={context}>
          <AddressSelector />
        </SaleTunnelV2Context.Provider>
      );
    };

    return { contextRef, Wrapper };
  };

  it('has not billing address and create one', async () => {
    const { contextRef, Wrapper } = buildWrapper();
    render(<Wrapper />);
    expect(contextRef.current.billingAddress).toBeUndefined();

    screen.debug();
  });
  it('has an existing main billing address and choose another', async () => {});
  it('has an existing main billing address and edit it', async () => {});
});
