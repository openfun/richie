import { defineMessages, useIntl } from 'react-intl';
import { MutateOptions } from '@tanstack/react-query';
import { useCreditCards } from 'hooks/useCreditCards';
import { CreditCard } from 'types/Joanie';
import { confirm } from 'utils/indirection/window';

const messages = defineMessages({
  errorCannotRemoveMain: {
    id: 'hooks.useCreditCardsManagement.errorCannotRemoveMain',
    description: 'Error shown if a user tries to delete a main credit card',
    defaultMessage: 'Cannot remove main credit card.',
  },
  deletionConfirmation: {
    id: 'hooks.useCreditCardsManagement.deletionConfirmation',
    description: 'Confirmation message shown to the user when he wants to delete a credit card',
    defaultMessage:
      'Are you sure you want to delete the credit card?\n⚠️ You cannot undo this change after.',
  },
});

export const useCreditCardsManagement = () => {
  const intl = useIntl();
  const creditCards = useCreditCards();

  const safeDelete = (creditCard: CreditCard, options?: MutateOptions) => {
    if (creditCard.is_main) {
      creditCards.methods.setError(intl.formatMessage(messages.errorCannotRemoveMain));
      return;
    }
    const sure = confirm(intl.formatMessage(messages.deletionConfirmation));
    if (!sure) {
      return;
    }
    creditCards.methods.delete(creditCard.id, options);
  };

  return {
    ...creditCards,
    methods: {
      ...creditCards.methods,
      safeDelete,
    },
  };
};
