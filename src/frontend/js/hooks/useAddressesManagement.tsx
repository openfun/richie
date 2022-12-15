import { defineMessages, useIntl } from 'react-intl';
import { MutateOptions } from '@tanstack/react-query';
import { useAddresses } from 'hooks/useAddresses';
import * as Joanie from 'types/Joanie';
import { confirm } from 'utils/indirection/window';

const messages = defineMessages({
  errorCannotRemoveMain: {
    id: 'hooks.useAddressesManagement.errorCannotRemoveMain',
    description: 'Error shown if a user tries to remove a main address',
    defaultMessage: 'Cannot remove main address.',
  },
  errorCannotPromoteMain: {
    id: 'hooks.useAddressesManagement.errorCannotPromoteMain',
    description: 'Error shown if a user tries to promote a main address',
    defaultMessage: 'Cannot promote main address.',
  },
  deletionConfirmation: {
    id: 'hooks.useAddressesManagement.deletionConfirmation',
    description: 'Confirmation message shown to the user when he wants to delete an address',
    defaultMessage:
      'Are you sure you want to delete the "{title}" address?\n⚠️ You cannot undo this change after.',
  },
  actionUpdate: {
    id: 'hooks.useAddressesManagement.actionUpdate',
    description: 'Action name for address update.',
    defaultMessage: 'update',
  },
});

/**
 * High-level helper to handle various `Address` CRUD with loading and error built-in.
 */
export function useAddressesManagement() {
  const intl = useIntl();
  const addresses = useAddresses();

  /**
   * Update the provided address to promote it as main
   *
   * @param {Joanie.Address} address
   */
  const promote = (address: Joanie.Address) => {
    if (address.is_main) {
      addresses.methods.setError(intl.formatMessage(messages.errorCannotPromoteMain));
      return;
    }
    addresses.methods.update({
      ...address,
      is_main: true,
    });
  };

  /**
   * Ask the user to confirm his intention
   * then make the request to delete the provided address
   *
   * @param {Joanie.Address} address
   * @param {AddressesMutateOptions} options
   */
  const remove = (address: Joanie.Address, options?: MutateOptions) => {
    if (address.is_main) {
      addresses.methods.setError(intl.formatMessage(messages.errorCannotRemoveMain));
      return;
    }
    // eslint-disable-next-line no-alert, no-restricted-globals
    const sure = confirm(
      intl.formatMessage(messages.deletionConfirmation, { title: address.title }),
    );
    if (!sure) {
      return;
    }
    addresses.methods.delete(address.id, options);
  };

  return {
    ...addresses,
    query: addresses,
    methods: {
      ...addresses.methods,
      promote,
      remove,
    },
  };
}
