import { Nullable } from './utils';

export enum OpenEdxLevelOfEducation {
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
export enum OpenEdxGender {
  FEMALE = 'f',
  MALE = 'm',
  OTHER = 'o',
}

export enum OpenEdxLanguageIsoCode {
  ENGLISH = 'en',
  FRENCH = 'fr',
}

export interface OpenEdxApiProfile {
  username: string;
  name: string;
  country: Nullable<string>;
  year_of_birth: Nullable<string>;
  level_of_education: Nullable<OpenEdxLevelOfEducation>;
  email: string;
  date_joined: string;
  gender: Nullable<OpenEdxGender>;
  'pref-lang'?: OpenEdxLanguageIsoCode;
  language_proficiencies: { code: OpenEdxLanguageIsoCode }[];
}
