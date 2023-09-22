import { FieldProps } from '@openfun/cunningham-react';
import { IntlShape } from 'react-intl';
import { Maybe } from 'types/utils';
import { ErrorKeys, ValidationError, errorMessages } from './ValidationErrors';

export const getLocalizedErrorMessage = (
  intl: IntlShape,
  error: Maybe<string | ValidationError>,
) => {
  if (!error) return undefined;
  if (typeof error === 'string' || !(error.key in errorMessages)) {
    // If the error has not been translated we return a default error message.
    return intl.formatMessage(errorMessages[ErrorKeys.MIXED_INVALID]);
  }

  return intl.formatMessage(errorMessages[error.key], error.values);
};

interface CunninghamErrorProp {
  text?: FieldProps['text'];
  textItems?: FieldProps['textItems'];
}
export const getLocalizedCunninghamErrorProp = (
  intl: IntlShape,
  error: Maybe<string | ValidationError>,
  defaultMessage?: string,
): CunninghamErrorProp | {} => {
  const message = getLocalizedErrorMessage(intl, error);
  const prop: CunninghamErrorProp = {};
  if (Array.isArray(message)) {
    prop.textItems = message.map((msg) => msg.toString());
  } else {
    prop.text = message || defaultMessage;
  }

  return prop;
};
