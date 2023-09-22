import countries from 'i18n-iso-countries';
import { defineMessages, useIntl } from 'react-intl';
import Select, { SelectProps } from './Select';

export const messages = defineMessages({
  label: {
    id: 'components.CountrySelectField.label',
    description: 'label of the country select',
    defaultMessage: 'Country',
  },
});

export const CountrySelectField = ({
  label: selectLabel,
  ...props
}: Omit<SelectProps, 'options'>) => {
  const intl = useIntl();
  const [languageCode] = intl.locale.split('-');

  const countryList = Object.entries(countries.getNames(languageCode)).map(
    ([value, label]: [string, string]) => {
      return { value, label };
    },
    [],
  );

  return (
    <Select
      label={selectLabel || intl.formatMessage(messages.label)}
      options={countryList}
      {...props}
    />
  );
};
