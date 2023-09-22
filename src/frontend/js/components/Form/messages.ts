import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  optionalFieldText: {
    id: 'components.form.messages.optionalFieldText',
    description: 'text display under form elements that are optional',
    defaultMessage: '(optional)',
  },
  formOptionalFieldsText: {
    id: 'components.form.messages.formOptionalFieldsText',
    description: 'Text at the top of forms indicating what are optional fields',
    defaultMessage: 'All fields are required unless marked optional',
  },
});
