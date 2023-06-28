import { defineMessages } from 'react-intl';

export enum ErrorKeys {
  MIXED_INVALID = 'mixedInvalid',
  MIXED_REQUIRED = 'mixedRequired',
  MIXED_ONEOF = 'mixedOneOf',
  STRING_MAX = 'stringMax',
  STRING_MIN = 'stringMin',
}

export const errorMessages = defineMessages<ErrorKeys>({
  [ErrorKeys.MIXED_INVALID]: {
    id: 'components.AddressesManagement.validationSchema.mixedInvalid',
    defaultMessage: 'This field is invalid.',
    description: 'Error message displayed when a field value is invalid.',
  },
  [ErrorKeys.MIXED_REQUIRED]: {
    id: 'components.AddressesManagement.validationSchema.mixedRequired',
    defaultMessage: 'This field is required.',
    description: 'Error message displayed when a field is required.',
  },
  [ErrorKeys.MIXED_ONEOF]: {
    id: 'components.AddressesManagement.validationSchema.mixedOneOf',
    defaultMessage: 'You must select a value.',
    description: 'Error message displayed when a field value must be one of a list.',
  },
  [ErrorKeys.STRING_MAX]: {
    id: 'components.AddressesManagement.validationSchema.stringMax',
    defaultMessage: 'The maximum length is {max} {max, plural, one {char} other {chars}}.',
    description: 'Error message displayed when a field value is too long.',
  },
  [ErrorKeys.STRING_MIN]: {
    id: 'components.AddressesManagement.validationSchema.stringMin',
    defaultMessage: 'The minimum length is {min} {min, plural, one {char} other {chars}}.',
    description: 'Error message displayed when a field value is too short.',
  },
});
