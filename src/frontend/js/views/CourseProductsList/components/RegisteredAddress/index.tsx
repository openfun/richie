import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import type { Address } from 'types/Joanie';

const messages = defineMessages({
  promoteButtonLabel: {
    id: 'components.AddressesManagement.promoteButtonLabel',
    description: 'Title of the button to set the address as the main one',
    defaultMessage: 'Define "{title}" address as main',
  },
  selectButtonLabel: {
    id: 'components.AddressesManagement.selectButtonLabel',
    description: 'Title of the select button',
    defaultMessage: 'Select "{title}" address',
  },
  selectButton: {
    id: 'components.AddressesManagement.selectButton',
    description: 'Label of the select button',
    defaultMessage: 'Use this address',
  },
  editButtonLabel: {
    id: 'components.AddressesManagement.editButtonLabel',
    description: 'Title of the edit button',
    defaultMessage: 'Edit "{title}" address',
  },
  editButton: {
    id: 'components.AddressesManagement.editButton',
    description: 'Label of the edit button',
    defaultMessage: 'Edit',
  },
  deleteButtonLabel: {
    id: 'components.AddressesManagement.deleteButtonLabel',
    description: 'Title of the delete button',
    defaultMessage: 'Delete "{title}" address',
  },
  deleteButton: {
    id: 'components.AddressesManagement.deleteButton',
    description: 'Label of the delete button',
    defaultMessage: 'Delete',
  },
  actionPromotion: {
    id: 'components.AddressesManagement.actionPromotion',
    description: 'Action name for address promotion.',
    defaultMessage: 'promotion',
  },
});

interface Props {
  address: Address;
  edit: (address: Address) => void;
  promote: (address: Address) => void;
  remove: (address: Address) => void;
  select: (address: Address) => void;
}

const RegisteredAddress = ({ promote, select, edit, remove, address }: Props) => {
  const intl = useIntl();

  return (
    <li className="registered-addresses-item">
      <button
        aria-describedby={`address-${address.id}-infos`}
        aria-label={intl.formatMessage(messages.promoteButtonLabel, { title: address.title })}
        className="button"
        onClick={() => promote(address)}
        title={intl.formatMessage(messages.promoteButtonLabel, { title: address.title })}
      >
        <span
          className={`address-main-indicator ${
            address.is_main ? 'address-main-indicator--is-main' : ''
          }`}
        />
      </button>
      <strong
        data-testid={`address-${address.id}-title`}
        className="h6 registered-addresses-item__title"
      >
        {address.title}
      </strong>
      <address
        className="registered-addresses-item__address"
        data-testid={`address-${address.id}-details`}
        id={`address-${address.id}-infos`}
      >
        {address.first_name}&nbsp;{address.last_name}
        <br />
        {address.address} {address.postcode} {address.city}, {address.country}
      </address>
      <p className="registered-addresses-item__actions">
        <button
          aria-label={intl.formatMessage(messages.selectButtonLabel, { title: address.title })}
          className="button button--tiny button--pill button-sale--primary"
          onClick={() => select(address)}
        >
          <FormattedMessage {...messages.selectButton} />
        </button>
        <button
          aria-label={intl.formatMessage(messages.editButtonLabel, { title: address.title })}
          className="button button--tiny button--pill  button-sale--secondary"
          onClick={() => edit(address)}
        >
          <FormattedMessage {...messages.editButton} />
        </button>
        <button
          aria-label={intl.formatMessage(messages.deleteButtonLabel, {
            title: address.title,
          })}
          className="button button--tiny button--pill  button-sale--secondary"
          disabled={address.is_main}
          onClick={() => remove(address)}
        >
          <FormattedMessage {...messages.deleteButton} />
        </button>
      </p>
    </li>
  );
};

export default RegisteredAddress;
