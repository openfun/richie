import { faker } from '@faker-js/faker';
import {
  OpenEdxGender,
  OpenEdxLanguageIsoCode,
  OpenEdxLevelOfEducation,
  OpenEdxApiProfile,
} from 'types/openEdx';
import { factory } from './factories';

export const OpenEdxApiProfileFactory = factory((): OpenEdxApiProfile => {
  return {
    username: faker.internet.userName(),
    name: faker.person.fullName(),
    country: faker.location.countryCode(),
    year_of_birth: faker.date.past().toISOString(),
    level_of_education: OpenEdxLevelOfEducation.ELEMENTARY_PRIMARY_SCHOOL,
    email: faker.internet.email(),
    date_joined: faker.date.past().toISOString(),
    gender: OpenEdxGender.MALE,
    'pref-lang': OpenEdxLanguageIsoCode.ENGLISH,
    language_proficiencies: [{ code: OpenEdxLanguageIsoCode.FRENCH }],
  };
});
