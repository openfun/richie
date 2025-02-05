import { defineMessages, useIntl } from 'react-intl';
import { MutateOptions } from '@tanstack/react-query';
import { useCreditCards } from 'hooks/useCreditCards';
import { CreditCard } from 'types/Joanie';
import { confirm } from 'utils/indirection/window';

const messages = defineMessages({
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
    const sure = confirm(intl.formatMessage(messages.deletionConfirmation));
    if (!sure) {
      return;
    }
    creditCards.methods.delete(creditCard, options);
  };

  return {
    ...creditCards,
    methods: {
      ...creditCards.methods,
      safeDelete,
    },
  };
};
