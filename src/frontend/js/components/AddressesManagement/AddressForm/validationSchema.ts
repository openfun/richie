import countries from 'i18n-iso-countries';
import * as Yup from 'yup';
import { ErrorKeys } from 'components/Form/ValidationErrors';

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
