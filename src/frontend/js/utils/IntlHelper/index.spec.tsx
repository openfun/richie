import { createIntl } from 'react-intl';
import { IntlHelper } from '.';

describe('IntlHelper', () => {
  it('extract multiple value names', () => {
    expect(
      IntlHelper.extractValueNames(
        'The name of the guy is "{guyName}" and he loves his cat named "{catName}"',
      ),
    ).toEqual(['guyName', 'catName']);
  });
  it('extract one value name', () => {
    expect(IntlHelper.extractValueNames('The name of the guy is "{guyName}"')).toEqual(['guyName']);
  });
  it('does not extract any values', () => {
    expect(IntlHelper.extractValueNames('Hi there')).toEqual([]);
  });
  it('does not extract any values', () => {
    expect(IntlHelper.extractValueNames('Hi there')).toEqual([]);
  });
  it('works with empty string', () => {
    expect(IntlHelper.extractValueNames('')).toEqual([]);
  });
  it('works with undefined string', () => {
    expect(IntlHelper.extractValueNames(undefined)).toEqual([]);
  });
  it('has existing values', () => {
    expect(
      IntlHelper.doValuesExist(
        {
          defaultMessage: [
            { type: 0, value: 'Her name is' },
            { type: 1, value: 'name' },
            { type: 0, value: '. It is a nice name.' },
          ],
        },
        {
          name: 'Katie',
        },
      ),
    ).toBe(true);
  });
  it('has non existing values', () => {
    expect(
      IntlHelper.doValuesExist(
        {
          defaultMessage: [
            { type: 0, value: 'Her name is' },
            { type: 1, value: 'name' },
            { type: 0, value: '. It is a nice name.' },
          ],
        },
        {
          thing: 'Katie',
        },
      ),
    ).toBe(false);
  });
  it('should return localized and sorted languages', () => {
    const intl = createIntl({ locale: 'en' });
    const languages = ['fr', 'en', 'de', 'es'];
    expect(IntlHelper.getLocalizedLanguages(languages, intl)).toEqual(
      'English, French, German and Spanish',
    );
  });
});
