import countries from 'i18n-iso-countries';
import * as Yup from 'yup';

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
