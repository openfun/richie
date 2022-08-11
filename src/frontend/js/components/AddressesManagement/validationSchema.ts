import countries from 'i18n-iso-countries';
import { defineMessages } from 'react-intl';
import * as Yup from 'yup';

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
    defaultMessage: 'You must select a value within: {values}.',
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

Yup.setLocale({
  mixed: {
    default: (values) => ({ key: ErrorKeys.MIXED_INVALID, values }),
    required: (values) => ({ key: ErrorKeys.MIXED_REQUIRED, values }),
    oneOf: (values) => ({ key: ErrorKeys.MIXED_ONEOF, values }),
  },
  string: {
    max: (values) => ({ key: ErrorKeys.STRING_MAX, values }),
    min: (values) => ({ key: ErrorKeys.STRING_MIN, values }),
  },
});

// / ! \ If you need to edit the validation schema,
// you should also add/edit error messages above.
const schema = Yup.object().shape({
  address: Yup.string().required(),
  city: Yup.string().required(),
  country: Yup.string().oneOf(Object.keys(countries.getAlpha2Codes())).required(),
  first_name: Yup.string().required(),
  last_name: Yup.string().required(),
  postcode: Yup.string().required(),
  title: Yup.string().required().min(2),
  save: Yup.boolean(),
});

export default schema;
