import { Fragment, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import AddressesManagement, { LOCAL_BILLING_ADDRESS_ID } from 'components/AddressesManagement';
import { SelectField } from 'components/Form';
import PaymentButton from 'components/PaymentButton';
import { RegisteredCreditCard } from 'components/RegisteredCreditCard';
import { useSession } from 'data/SessionProvider';
import { useAddresses } from 'hooks/useAddresses';
import { useCreditCards } from 'hooks/useCreditCards';
import type * as Joanie from 'types/Joanie';
import type { Maybe, Nullable } from 'types/utils';

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
    defaultMessage: 'You have not yet a billing address.',
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
  product: Joanie.Product;
  next: () => void;
}

export const SaleTunnelStepPayment = ({ product, next }: SaleTunnelStepPaymentProps) => {
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
   * @param {React.ChangeEvent<HTMLSelectElement>} event
   */
  const handleSelectAddress = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const targetedAddress = addresses.items.find((a) => a.id === event.target.value);
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

  if (showAddressCreationForm) {
    return (
      <AddressesManagement
        handleClose={() => setShowAddressCreationForm(false)}
        selectAddress={setAddress}
      />
    );
  }

  if (!user) return null;

  return (
    <section className="SaleTunnelStepPayment">
      <section className="SaleTunnelStepPayment__block">
        <header className="SaleTunnelStepPayment__block__header">
          <h5 className="SaleTunnelStepPayment__block__title">
            <FormattedMessage {...messages.resumeTile} />
          </h5>
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
          <h5 className="SaleTunnelStepPayment__block__title">
            <FormattedMessage {...messages.userTile} />
          </h5>
        </header>
        <div className="SaleTunnelStepPayment__block--buyer">
          <strong className="h6 SaleTunnelStepPayment__block--buyer__name">
            {user.fullname || user.username}
          </strong>
          {user.email ? (
            <p className="SaleTunnelStepPayment__block--buyer__email">{user.email}</p>
          ) : null}
          <header className="SaleTunnelStepPayment__block--buyer__address-header">
            <h6>
              <FormattedMessage {...messages.userBillingAddressFieldset} />
            </h6>
            {addressesItems.length > 0 && (
              <button
                className="button button--tiny button--pill button-sale--secondary"
                onClick={() => setShowAddressCreationForm(true)}
              >
                <svg className="button__icon" aria-hidden="true">
                  <use href="#icon-plus" />
                </svg>
                <FormattedMessage {...messages.userBillingAddressAddLabel} />
              </button>
            )}
          </header>
          {addressesItems.length > 0 ? (
            <Fragment>
              <SelectField
                fieldClasses={['form-field--minimal']}
                id="invoice_address"
                name="invoice_address"
                label={intl.formatMessage(messages.userBillingAddressSelectLabel)}
                onChange={handleSelectAddress}
                defaultValue={selectedAddress!.id || ''}
              >
                {addressesItems.map(({ id, title }) => (
                  <option
                    data-testid={`address-${id}-option`}
                    key={`address-${id}-option`}
                    value={id}
                  >
                    {title}
                  </option>
                ))}
              </SelectField>
              <address className="SaleTunnelStepPayment__block--buyer__address">
                {selectedAddress!.first_name}&nbsp;{selectedAddress!.last_name}
                <br />
                {selectedAddress!.address}
                <br />
                {selectedAddress!.postcode} {selectedAddress!.city}, {selectedAddress!.country}
              </address>
            </Fragment>
          ) : (
            <Fragment>
              <p className="SaleTunnelStepPayment__block--buyer__address__noAddress">
                <em>
                  <FormattedMessage {...messages.userBillingAddressNoEntry} />
                </em>
              </p>
              <button
                aria-hidden="true"
                className="button button--tiny button--pill button-sale--primary"
                onClick={() => setShowAddressCreationForm(true)}
              >
                <svg className="button__icon" role="img">
                  <use href="#icon-plus" />
                </svg>
                <FormattedMessage {...messages.userBillingAddressCreateLabel} />
              </button>
            </Fragment>
          )}
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
          product={product}
          creditCard={selectedCreditCard}
          billingAddress={selectedAddress}
          onSuccess={next}
        />
      </footer>
    </section>
  );
};
