import countries from 'i18n-iso-countries';
import { forwardRef } from 'react';
import { useIntl } from 'react-intl';
import { SelectField, SelectFieldProps } from 'components/Form/Inputs';

export const CountrySelectField = forwardRef<HTMLSelectElement, SelectFieldProps>((props, ref) => {
  const intl = useIntl();
  const [languageCode] = intl.locale.split('-');
  const countryList = countries.getNames(languageCode);
  return (
    <SelectField {...props} ref={ref}>
      <option disabled value="-">
        -
      </option>
      {Object.entries(countryList).map(([value, label]) => (
        <option key={`address-countryList-${value}`} value={value}>
          {label}
        </option>
      ))}
    </SelectField>
  );
});
