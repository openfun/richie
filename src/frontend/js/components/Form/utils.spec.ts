import { createIntl } from 'react-intl';
import { ErrorKeys } from './ValidationErrors';
import { getLocalizedCunninghamErrorProp, getLocalizedErrorMessage } from './utils';

describe('Form > utils', () => {
  describe('getLocalizedErrorMessage', () => {
    it('should return expected message for existing errorKey', () => {
      const intl = createIntl({ locale: 'en' });
      expect(getLocalizedErrorMessage(intl, { key: ErrorKeys.MIXED_REQUIRED, values: {} })).toBe(
        'This field is required.',
      );
      expect(getLocalizedErrorMessage(intl, { key: ErrorKeys.MIXED_ONEOF, values: {} })).toBe(
        'You must select a value.',
      );
      expect(
        getLocalizedErrorMessage(intl, {
          key: ErrorKeys.STRING_MAX,
          values: {
            max: 1,
          },
        }),
      ).toBe('The maximum length is 1 char.');
      expect(
        getLocalizedErrorMessage(intl, {
          key: ErrorKeys.STRING_MAX,
          values: {
            max: 10,
          },
        }),
      ).toBe('The maximum length is 10 chars.');
      expect(
        getLocalizedErrorMessage(intl, {
          key: ErrorKeys.STRING_MIN,
          values: {
            min: 1,
          },
        }),
      ).toBe('The minimum length is 1 char.');
      expect(
        getLocalizedErrorMessage(intl, {
          key: ErrorKeys.STRING_MIN,
          values: {
            min: 10,
          },
        }),
      ).toBe('The minimum length is 10 chars.');
    });
    it("should return default message when errorKey doesn't exists", () => {
      const intl = createIntl({ locale: 'en' });
      expect(getLocalizedErrorMessage(intl, 'UNKNOWN_KEY')).toBe('This field is invalid.');
    });
  });

  describe('getLocalizedCunninghamErrorProp', () => {
    it('should return default message when no error is given', () => {
      const intl = createIntl({ locale: 'en' });
      expect(
        getLocalizedCunninghamErrorProp(intl, undefined, 'This is a default message.'),
      ).toEqual({ text: 'This is a default message.' });
    });
    it('should return text prop', () => {
      const intl = createIntl({ locale: 'en' });
      expect(
        getLocalizedCunninghamErrorProp(
          intl,
          { key: ErrorKeys.MIXED_REQUIRED, values: {} },
          'This is a default message',
        ),
      ).toEqual({ text: 'This field is required.' });
    });
  });
});
