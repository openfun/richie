import { Nullable } from './utils';

export enum LevelOfEducation {
  PHD_OR_DOCTORATE = 'p',
  MASTER_OR_PROFESSIONNAL_DEGREE = 'm',
  BACHELOR_DEGREE = 'b',
  ASSOCIATE_DEGREE = 'a',
  SECONDARY_OR_HIGH_SCHOOL = 'hs',
  JUNIOR_SECONDARY_OR_MIDDLE_SCHOOL = 'jhs',
  ELEMENTARY_PRIMARY_SCHOOL = 'el',
  NONE = 'none',
  OTHER = 'o',
}

// * null
// * "f"
// * "m"
// * "o"
export enum Gender {
  FEMALE = 'f',
  MALE = 'm',
  OTHER = 'o',
}

export enum LanguageIsoCode {
  ENGLISH = 'en',
  FRENCH = 'fr',
}

export interface OpenEdxApiProfile {
  username: string;
  name: string;
  country: string;
  year_of_birth: string;
  level_of_education: Nullable<LevelOfEducation>;
  email: string;
  date_joined: string;
  gender: Nullable<Gender>;
  'pref-lang': LanguageIsoCode;
  language_proficiencies: { code: LanguageIsoCode }[];
}
