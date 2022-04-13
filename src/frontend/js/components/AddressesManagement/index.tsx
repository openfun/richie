import { Children, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import Banner, { BannerType } from 'components/Banner';
import { useAddresses } from 'hooks/useAddresses';
import type * as Joanie from 'types/Joanie';
import { Maybe } from 'types/utils';
import { confirm } from 'utils/indirection/window';
import RegisteredAddress from 'components/RegisteredAddress';
import AddressForm, { type AddressFormValues } from 'components/AddressesManagement/AddressForm';
import { Icon } from 'components/Icon';

// constant used as `address.id` for local address
export const LOCAL_BILLING_ADDRESS_ID = 'local-billing-address';

export const messages = defineMessages({
  registeredAddresses: {
    id: 'components.AddressesManagement.registeredAddresses',
    description: 'Title of the registered addresses block',
    defaultMessage: 'Your addresses',
  },
  addAddress: {
    id: 'components.AddressesManagement.addAddress',
    description: 'Title of the address creation form',
    defaultMessage: 'Add a new address',
  },
  editAddress: {
    id: 'components.AddressesManagement.editAddress',
    description: 'Title of the address edit form',
    defaultMessage: 'Update address {title}',
  },
  titleInputLabel: {
    id: 'components.AddressesManagement.titleInput',
    description: 'Label of the "title" input',
    defaultMessage: 'Address title',
  },
  first_nameInputLabel: {
    id: 'components.AddressesManagement.first_nameInput',
    description: 'Label of the "first_name" input',
    defaultMessage: "Recipient's first name",
  },
  last_nameInputLabel: {
    id: 'components.AddressesManagement.last_nameInput',
    description: 'Label of the "last_name" input',
    defaultMessage: "Recipient's last name",
  },
  addressInputLabel: {
    id: 'components.AddressesManagement.addressInput',
    description: 'Label of the "address" input',
    defaultMessage: 'Address',
  },
  cityInputLabel: {
    id: 'components.AddressesManagement.cityInput',
    description: 'Label of the "city" input',
    defaultMessage: 'City',
  },
  postcodeInputLabel: {
    id: 'components.AddressesManagement.postcodeInput',
    description: 'Label of the "postcode" input',
    defaultMessage: 'Postcode',
  },
  countryInputLabel: {
    id: 'components.AddressesManagement.countryInput',
    description: 'Label of the "country" input',
    defaultMessage: 'Country',
  },
  saveInputLabel: {
    id: 'components.AddressesManagement.saveInput',
    description: 'Label of the "save" input',
    defaultMessage: 'Save this address',
  },
  cancelButton: {
    id: 'components.AddressesManagement.cancelButton',
    description: 'Label of the cancel button',
    defaultMessage: 'Cancel',
  },
  cancelTitleButton: {
    id: 'components.AddressesManagement.cancelTitleButton',
    description: 'Title of the cancel button',
    defaultMessage: 'Cancel edition',
  },
  closeButton: {
    id: 'components.AddressesManagement.closeButton',
    description: 'Label of the close button',
    defaultMessage: 'Go back',
  },
  updateButton: {
    id: 'components.AddressesManagement.updateButton',
    description: 'Label of the update button',
    defaultMessage: 'Update this address',
  },
  deletionConfirmation: {
    id: 'components.AddressesManagement.deletionConfirmation',
    description: 'Confirmation message shown to the user when he wants to delete an address',
    defaultMessage:
      'Are you sure you want to delete the "{title}" address ?\n⚠️ You cannot undo this change after.',
  },
  error: {
    id: 'components.AddressesManagement.error',
    description:
      'Error message shown to the user when address creation/update/deletion request fails.',
    defaultMessage: 'An error occurred while address {action}. Please retry later.',
  },
  actionCreation: {
    id: 'components.AddressesManagement.actionCreation',
    description: 'Action name for address creation.',
    defaultMessage: 'creation',
  },
  actionUpdate: {
    id: 'components.AddressesManagement.actionUpdate',
    description: 'Action name for address update.',
    defaultMessage: 'update',
  },
  actionDeletion: {
    id: 'components.AddressesManagement.actionDeletion',
    description: 'Action name for address deletion.',
    defaultMessage: 'deletion',
  },
  actionPromotion: {
    id: 'components.AddressesManagement.actionPromotion',
    description: 'Action name for address promotion.',
    defaultMessage: 'promotion',
  },
  selectButton: {
    id: 'components.AddressesManagement.selectButton',
    description: 'Label of the select button',
    defaultMessage: 'Use this address',
  },
});

interface AddressesManagementProps {
  handleClose: () => void;
  selectAddress: (address: Joanie.Address) => void;
}

const AddressesManagement = ({ handleClose, selectAddress }: AddressesManagementProps) => {
  const intl = useIntl();
  const addresses = useAddresses();
  const [editedAddress, setEditedAddress] = useState<Maybe<Joanie.Address>>();
  const [error, setError] = useState<Maybe<string>>();

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

  /**
   * update `selectedAddress` state with the address provided
   * then close the address management form
   *
   * @param {Joanie.Address} address
   */
  const handleSelect = (address: Joanie.Address) => {
    setError(undefined);
    selectAddress(address);
    handleClose();
  };

  /**
   * Ask the user to confirm his intention
   * then make the request to delete the provided address
   *
   * @param {Joanie.Address} address
   */
  const handleDelete = (address: Joanie.Address) => {
    setError(undefined);
    // eslint-disable-next-line no-alert, no-restricted-globals
    const sure = confirm(
      intl.formatMessage(messages.deletionConfirmation, { title: address.title }),
    );
    if (!address.is_main && sure) {
      addresses.methods.delete(address.id, {
        onError: () => setError(intl.formatMessage(messages.actionDeletion)),
      });
    }
  };

  /**
   * Create a new address according to form values
   * then update `selectedAddress` state with this new one.
   * If `save` checkbox input is checked, the address is persisted
   * otherwise it is only stored through the `selectedAddress` state.
   *
   * @param {AddressFormValues} formValues address fields to update
   */
  const handleCreate = async ({ save, ...address }: AddressFormValues) => {
    setError(undefined);
    if (save) {
      await addresses.methods.create(address, {
        onSuccess: handleSelect,
        onError: () => setError(intl.formatMessage(messages.actionCreation)),
      });
    } else {
      handleSelect({
        id: LOCAL_BILLING_ADDRESS_ID,
        is_main: false,
        ...address,
      });
    }
  };

  /**
   * Update the `editedAddress` with new values provided as argument
   * then clear `editedAddress` state if request succeeded.
   *
   * @param {AddressFormValues} formValues address fields to update
   */
  const handleUpdate = async ({ save, ...newAddress }: AddressFormValues) => {
    setError(undefined);
    addresses.methods.update(
      {
        ...editedAddress!,
        ...newAddress,
      },
      {
        onSuccess: () => setEditedAddress(undefined),
        onError: () => setError(intl.formatMessage(messages.actionUpdate)),
      },
    );
  };

  /**
   * Update the provided address to promote it as main
   *
   * @param {Joanie.Address} address
   */
  const promoteAddress = (address: Joanie.Address) => {
    if (!address.is_main) {
      setError(undefined);
      addresses.methods.update(
        {
          ...address,
          is_main: true,
        },
        {
          onError: () => setError(intl.formatMessage(messages.actionPromotion)),
        },
      );
    }
  };

  useEffect(() => {
    setError(undefined);
  }, [editedAddress]);

  return (
    <div className="AddressesManagement">
      <button className="button button-sale--tertiary" onClick={handleClose}>
        <Icon name="icon-chevron-down" className="button__icon" />
        <FormattedMessage {...messages.closeButton} />
      </button>
      {error && (
        <Banner
          message={intl.formatMessage(messages.error, { action: error })}
          type={BannerType.ERROR}
          rounded
        />
      )}
      {addresses.items.length > 0 ? (
        <section className="address-registered">
          <header>
            <h5>
              <FormattedMessage {...messages.registeredAddresses} />
            </h5>
          </header>
          <ul className="registered-addresses-list">
            {Children.toArray(
              addresses.items
                .sort(sortAddressByTitleAsc)
                .map((address) => (
                  <RegisteredAddress
                    address={address}
                    edit={setEditedAddress}
                    promote={promoteAddress}
                    remove={handleDelete}
                    select={handleSelect}
                  />
                )),
            )}
          </ul>
        </section>
      ) : null}
      <section className={`address-form ${editedAddress ? 'address-form--highlighted' : ''}`}>
        <header>
          <h5>
            {editedAddress ? (
              <FormattedMessage {...messages.editAddress} values={{ title: editedAddress.title }} />
            ) : (
              <FormattedMessage {...messages.addAddress} />
            )}
          </h5>
        </header>
        <AddressForm
          address={editedAddress}
          handleReset={() => setEditedAddress(undefined)}
          onSubmit={editedAddress ? handleUpdate : handleCreate}
        />
      </section>
    </div>
  );
};

export default AddressesManagement;
