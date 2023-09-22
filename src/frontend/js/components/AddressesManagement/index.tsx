import { Children, forwardRef, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import AddressForm, { type AddressFormValues } from 'components/AddressesManagement/AddressForm';
import Banner, { BannerType } from 'components/Banner';
import { Icon, IconTypeEnum } from 'components/Icon';
import RegisteredAddress from 'components/RegisteredAddress';
import { useAddressesManagement } from 'hooks/useAddressesManagement';
import type * as Joanie from 'types/Joanie';
import { Address } from 'types/Joanie';
import { Maybe } from 'types/utils';

// constant used as `address.id` for local address
export const LOCAL_BILLING_ADDRESS_ID = 'local-billing-address';

export const messages = defineMessages({
  optionalFieldText: {
    id: 'components.AddressesManagement.optionalFieldText',
    description: 'text Displayed below form elements that are optional',
    defaultMessage: '(optional)',
  },
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
  requiredFields: {
    id: 'components.AddressesManagement.requiredFields',
    description: 'Text at the top of address creation form indicating what are required fields',
    defaultMessage: 'Fields marked with {symbol} are required',
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

const AddressesManagement = forwardRef<HTMLDivElement, AddressesManagementProps>(
  ({ handleClose, selectAddress }, ref) => {
    const intl = useIntl();
    const [editedAddress, setEditedAddress] = useState<Maybe<Joanie.Address>>();
    const {
      methods: { setError, create, update, remove, promote },
      states: { error },
      ...addresses
    } = useAddressesManagement();

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
     * Create a new address according to form values
     * then update `selectedAddress` state with this new one.
     * If `save` checkbox input is checked, the address is persisted
     * otherwise it is only stored through the `selectedAddress` state.
     *
     * @param {AddressFormValues} formValues address fields to update
     */
    const handleCreate = async ({ save, ...address }: AddressFormValues) => {
      if (save) {
        await create(address, { onSuccess: handleSelect });
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
      update(
        {
          ...editedAddress!,
          ...newAddress,
        },
        {
          onSuccess: () => setEditedAddress(undefined),
        },
      );
    };

    useEffect(() => {
      setError(undefined);
      if (editedAddress) {
        document.querySelector<HTMLElement>('[name="address-form"] input')?.focus();
      }
    }, [editedAddress]);

    return (
      <div className="AddressesManagement" ref={ref}>
        <Button
          className="AddressesManagement__closeButton"
          color="tertiary"
          size="small"
          onClick={handleClose}
        >
          <Icon name={IconTypeEnum.CHEVRON_LEFT_OUTLINE} className="button__icon" />
          <FormattedMessage {...messages.closeButton} />
        </Button>
        {error && <Banner message={error} type={BannerType.ERROR} rounded />}
        {addresses.items.length > 0 ? (
          <section className="address-registered">
            <header>
              <h2 className="h5">
                <FormattedMessage {...messages.registeredAddresses} />
              </h2>
            </header>
            <ul className="registered-addresses-list">
              {Children.toArray(
                addresses.items
                  .sort(sortAddressByTitleAsc)
                  .map((address) => (
                    <RegisteredAddress
                      address={address}
                      edit={setEditedAddress}
                      promote={promote}
                      remove={remove}
                      select={handleSelect}
                    />
                  )),
              )}
            </ul>
          </section>
        ) : null}
        <section className={`address-form ${editedAddress ? 'address-form--highlighted' : ''}`}>
          <header>
            <h2 className="h5">
              {editedAddress ? (
                <FormattedMessage
                  {...messages.editAddress}
                  values={{ title: editedAddress.title }}
                />
              ) : (
                <FormattedMessage {...messages.addAddress} />
              )}
            </h2>
          </header>
          <AddressForm
            address={editedAddress}
            handleReset={() => setEditedAddress(undefined)}
            onSubmit={editedAddress ? handleUpdate : handleCreate}
          />
        </section>
      </div>
    );
  },
);

export default AddressesManagement;
