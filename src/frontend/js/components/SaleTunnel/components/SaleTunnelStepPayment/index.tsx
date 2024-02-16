import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import { Button, Select } from '@openfun/cunningham-react';
import PaymentButton from 'components/PaymentButton';
import AddressesManagement, { LOCAL_BILLING_ADDRESS_ID } from 'components/AddressesManagement';
import { useSession } from 'contexts/SessionContext';
import { useAddresses } from 'hooks/useAddresses';
import { useCreditCards } from 'hooks/useCreditCards';
import type * as Joanie from 'types/Joanie';
import type { Maybe, Nullable } from 'types/utils';
import { Icon, IconTypeEnum } from 'components/Icon';
import { useSaleTunnelContext } from 'components/SaleTunnel/context';
import { UserHelper } from 'utils/UserHelper';
import { AddressView } from 'components/Address';
import { RegisteredCreditCard } from '../RegisteredCreditCard';

const messages = defineMessages({
  resumeTile: {
    defaultMessage: 'You are about to purchase',
    description: 'Label for the resume tile',
    id: 'components.SaleTunnelStepPayment.resumeTile',
  },
  userTile: {
    defaultMessage: 'Your personal information',
    description: 'Label for the user information tile',
    id: 'components.SaleTunnelStepPayment.userTile',
  },
  userBillingAddressFieldset: {
    defaultMessage: 'Billing address',
    description: 'Label for the billing address fieldset',
    id: 'components.SaleTunnelStepPayment.userBillingAddressFieldset',
  },
  userBillingAddressSelectLabel: {
    defaultMessage: 'Select a billing address',
    description: 'Label for the billing address select',
    id: 'components.SaleTunnelStepPayment.userBillingAddressSelectLabel',
  },
  userBillingAddressNoEntry: {
    defaultMessage: "You don't have any billing addresses yet.",
    description: 'Message displayed when the user has no address.',
    id: 'components.SaleTunnelStepPayment.userBillingAddressNoEntry',
  },
  userBillingAddressCreateLabel: {
    defaultMessage: 'Create an address',
    description: 'Label for the billing address create button',
    id: 'components.SaleTunnelStepPayment.userBillingAddressCreateLabel',
  },
  userBillingAddressAddLabel: {
    defaultMessage: 'Add an address',
    description: 'Label for the billing address add button',
    id: 'components.SaleTunnelStepPayment.userBillingAddressAddLabel',
  },
  registeredCardSectionTitle: {
    defaultMessage: 'Your registered credit card',
    description: 'Label for the registered credit cards section',
    id: 'components.SaleTunnelStepPayment.registeredCardSectionTitle',
  },
});

interface SaleTunnelStepPaymentProps {
  next: () => void;
}

export const SaleTunnelStepPayment = ({ next }: SaleTunnelStepPaymentProps) => {
  const { product } = useSaleTunnelContext();
  /**
   * Sort addresses ascending by title according to the locale
   *
   * @param {Joanie.Address} a
   * @param {Joanie.Address} b
   * @returns {Joanie.Address[]} Sorted addresses ascending by title
   */
  const sortAddressByTitleAsc = (a: Joanie.Address, b: Joanie.Address) => {
    return a.title.localeCompare(b.title, [intl.locale, intl.defaultLocale]);
  };

  const intl = useIntl();
  const { user } = useSession();
  const addresses = useAddresses();
  const creditCards = useCreditCards();

  const [showAddressCreationForm, setShowAddressCreationForm] = useState(false);

  const [creditCard, setCreditCard] = useState<Maybe<Nullable<string>>>(
    creditCards.items.find((c) => c.is_main)?.id,
  );

  const [address, setAddress] = useState<Maybe<Joanie.Address>>(() =>
    addresses.items.find((a) => a.is_main),
  );

  const selectedCreditCard = useMemo(
    () => (creditCard !== undefined ? creditCard : creditCards.items.find((c) => c.is_main)?.id),
    [creditCard, creditCards],
  );

  const selectedAddress = useMemo(
    (): Maybe<Joanie.Address> =>
      address ||
      addresses.items.find((a) => a.is_main) ||
      [...addresses.items].sort(sortAddressByTitleAsc)[0],
    [address, addresses],
  );

  /**
   * Memoized address items.
   * If the selected address is a local one, we have to add it to the item list.
   * Finally, we sort address ascending by title before return them
   *
   * @returns {Joanie.Address[]} Sorted addresses ascending by title
   */
  const addressesItems = useMemo(() => {
    const items = [...addresses.items];

    // Add local address to the address item list.
    if (selectedAddress?.id === LOCAL_BILLING_ADDRESS_ID) {
      items.push(selectedAddress);
    }

    return items.sort(sortAddressByTitleAsc);
  }, [addresses.items, selectedAddress]);

  /**
   * Retrieve address through its `id` provided by the event target value
   * then update `selectedAddress` state
   *
   * @param {string} newValue
   */
  const handleSelectAddress = (newValue: string) => {
    const targetedAddress = addresses.items.find((a) => a.id === newValue);
    if (targetedAddress) {
      setAddress(targetedAddress);
    }
  };

  const toggleCreditCard = (creditCardId: string) => {
    if (selectedCreditCard === creditCardId) {
      setCreditCard(null);
    } else {
      setCreditCard(creditCardId);
    }
  };

  const addressRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showAddressCreationForm) {
      addressRef.current?.querySelector<HTMLElement>('.AddressesManagement__closeButton')?.focus();
    } else {
      document.querySelector<HTMLElement>('#sale-tunnel-address-header')?.focus();
    }
  }, [showAddressCreationForm]);

  if (showAddressCreationForm) {
    return (
      <AddressesManagement
        ref={addressRef}
        handleClose={() => {
          setShowAddressCreationForm(false);
        }}
        selectAddress={setAddress}
      />
    );
  }

  if (!user) return null;

  return (
    <section className="SaleTunnelStepPayment">
      <section className="SaleTunnelStepPayment__block">
        <header className="SaleTunnelStepPayment__block__header">
          <h2 className="SaleTunnelStepPayment__block__title">
            <FormattedMessage {...messages.resumeTile} />
          </h2>
        </header>
        <div className="SaleTunnelStepPayment__block--product">
          <strong className="SaleTunnelStepPayment__block--product__title">{product.title}</strong>
          <p className="SaleTunnelStepPayment__block--product__price">
            <FormattedNumber
              value={product.price}
              style="currency"
              currency={product.price_currency}
            />
          </p>
        </div>
      </section>
      <section className="SaleTunnelStepPayment__block">
        <header className="SaleTunnelStepPayment__block__header">
          <h2 className="SaleTunnelStepPayment__block__title">
            <FormattedMessage {...messages.userTile} />
          </h2>
        </header>
        <div className="SaleTunnelStepPayment__block--buyer">
          <strong className="h6 SaleTunnelStepPayment__block--buyer__name">
            {UserHelper.getName(user)}
          </strong>
          {user.email ? (
            <p className="SaleTunnelStepPayment__block--buyer__email">{user.email}</p>
          ) : null}
          <header
            tabIndex={-1}
            id="sale-tunnel-address-header"
            className="SaleTunnelStepPayment__block--buyer__address-header"
          >
            <h3 className="h6">
              <FormattedMessage {...messages.userBillingAddressFieldset} />
            </h3>
            {addressesItems.length > 0 && (
              <Button
                size="small"
                color="secondary"
                onClick={() => setShowAddressCreationForm(true)}
                icon={<Icon name={IconTypeEnum.PLUS} className="button__icon" size="small" />}
              >
                <FormattedMessage {...messages.userBillingAddressAddLabel} />
              </Button>
            )}
          </header>
          <div className="SaleTunnelStepPayment__block--buyer__address-selection">
            {addressesItems.length > 0 ? (
              <Fragment>
                <Select
                  className="form-field--minimal"
                  name="invoice_address"
                  clearable={false}
                  label={intl.formatMessage(messages.userBillingAddressSelectLabel)}
                  onChange={(e) => handleSelectAddress((e.target.value || '') as string)}
                  defaultValue={selectedAddress!.id || ''}
                  options={addressesItems.map(({ id, title }) => ({
                    label: title,
                    value: id,
                  }))}
                />
                <div className="SaleTunnelStepPayment__block--buyer__address-selection__address">
                  <AddressView address={selectedAddress!} />
                </div>
              </Fragment>
            ) : (
              <Fragment>
                <p className="SaleTunnelStepPayment__block--buyer__address__noAddress">
                  <em>
                    <FormattedMessage {...messages.userBillingAddressNoEntry} />
                  </em>
                </p>
                <Button
                  size="small"
                  onClick={() => setShowAddressCreationForm(true)}
                  icon={<Icon name={IconTypeEnum.PLUS} size="small" className="button__icon" />}
                >
                  <FormattedMessage {...messages.userBillingAddressCreateLabel} />
                </Button>
              </Fragment>
            )}
          </div>
        </div>
      </section>
      {creditCards.items?.length > 0 ? (
        <section className="SaleTunnelStepPayment__block">
          <header className="SaleTunnelStepPayment__block__header">
            <h5 className="SaleTunnelStepPayment__block__title">
              <FormattedMessage {...messages.registeredCardSectionTitle} />
            </h5>
          </header>
          <ul className="SaleTunnelStepPayment__block--registered-credit-card-list">
            {creditCards.items.map((card) => (
              <li key={`credit-card-${card.id}`}>
                <RegisteredCreditCard
                  selected={selectedCreditCard === card.id}
                  handleSelect={() => toggleCreditCard(card.id)}
                  {...card}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <footer className="SaleTunnelStepPayment__footer">
        <PaymentButton
          creditCard={selectedCreditCard}
          billingAddress={selectedAddress}
          onSuccess={next}
        />
      </footer>
    </section>
  );
};
