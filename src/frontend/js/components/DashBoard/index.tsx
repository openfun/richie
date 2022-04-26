import { FC, Fragment, useMemo, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { RegisteredCreditCard } from 'components/RegisteredCreditCard';
import { useJoanieApi } from 'data/JoanieApiProvider';
import { useCreditCards } from 'hooks/useCreditCards';
import { Maybe, Nullable } from 'types/utils';
import * as Joanie from 'types/Joanie';
import { useAddresses } from 'hooks/useAddresses';
import { SelectField } from 'components/Form';
import AddressesManagement, { LOCAL_BILLING_ADDRESS_ID } from 'components/AddressesManagement';

const messages = defineMessages({
  userTile: {
    defaultMessage: 'Your personal information',
    description: 'Label for the user information tile',
    id: 'components.Dashboard.userTile',
  },
  userBillingAddressSelectLabel: {
    defaultMessage: 'Select a billing address',
    description: 'Label for the billing address select',
    id: 'components.Dashboard.userBillingAddressSelectLabel',
  },
  userBillingAddressNoEntry: {
    defaultMessage: 'You have not yet a billing address.',
    description: 'Message displayed when the user has no address.',
    id: 'components.Dashboard.userBillingAddressNoEntry',
  },
  userBillingAddressCreateLabel: {
    defaultMessage: 'Create an address',
    description: 'Label for the billing address create button',
    id: 'components.Dashboard.userBillingAddressCreateLabel',
  },
  registeredCardSectionTitle: {
    defaultMessage: 'Your registered credit card',
    description: 'Label for the registered credit cards section',
    id: 'components.Dashboard.registeredCardSectionTitle',
  },
});

const DashBoard: FC = () => {
  useJoanieApi();
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

  return (
    <div className="dashboard" title="dashboard">
      <span>{intl.formatMessage(messages.userTile)}</span>
      {showAddressCreationForm && (
        <AddressesManagement
          handleClose={() => setShowAddressCreationForm(false)}
          selectAddress={setAddress}
        />
      )}

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
              <option data-testid={`address-${id}-option`} key={`address-${id}-option`} value={id}>
                {title}
              </option>
            ))}
          </SelectField>
          <address className="Dashboard__block--buyer__address">
            {selectedAddress!.first_name}&nbsp;{selectedAddress!.last_name}
            <br />
            {selectedAddress!.address}
            <br />
            {selectedAddress!.postcode} {selectedAddress!.city}, {selectedAddress!.country}
          </address>
        </Fragment>
      ) : (
        <Fragment>
          <p className="Dashboard__block--buyer__address__noAddress">
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
      {creditCards.items?.length > 0 ? (
        <section className="Dashboard__block">
          <header className="Dashboard__block__header">
            <h5 className="Dashboard__block__title">
              <FormattedMessage {...messages.registeredCardSectionTitle} />
            </h5>
          </header>
          <ul className="Dashboard__block--registered-credit-card-list">
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
    </div>
  );
};

export default DashBoard;
