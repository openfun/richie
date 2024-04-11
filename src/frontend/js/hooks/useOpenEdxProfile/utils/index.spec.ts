import { createIntl } from 'react-intl';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { OpenEdxGender, OpenEdxLanguageIsoCode, OpenEdxLevelOfEducation } from 'types/openEdx';
import { parseOpenEdxApiProfile } from '.';

describe('useOpenEdxProfile > utils', () => {
  it('parseOpenEdxApiProfile should format values', () => {
    const profile = parseOpenEdxApiProfile(
      createIntl({ locale: 'en' }),
      OpenEdxApiProfileFactory({
        username: 'John',
        name: 'Do',
        email: 'john.do@whereis.net',
        'pref-lang': OpenEdxLanguageIsoCode.FRENCH,
        country: 'fr',
        level_of_education: OpenEdxLevelOfEducation.MASTER_OR_PROFESSIONNAL_DEGREE,
        gender: OpenEdxGender.MALE,
        year_of_birth: '01/01/1970',
        language_proficiencies: [{ code: OpenEdxLanguageIsoCode.ENGLISH }],
        date_joined: '01/01/1970',
      }).one(),
    );

    expect(profile).toStrictEqual({
      username: 'John',
      name: 'Do',
      email: 'john.do@whereis.net',
      language: 'French',
      country: 'France',
      levelOfEducation: 'Master',
      gender: 'Male',
      yearOfBirth: '01/01/1970',
      favoriteLanguage: 'English',
      dateJoined: '01/01/1970',
    });
  });
});
