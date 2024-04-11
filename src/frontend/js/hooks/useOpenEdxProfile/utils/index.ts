import { IntlShape, defineMessages } from 'react-intl';
import countries from 'i18n-iso-countries';
import { OpenEdxGender, OpenEdxLevelOfEducation, OpenEdxApiProfile } from 'types/openEdx';
import { Maybe } from 'types/utils';

export const levelOfEducationMessages = defineMessages<OpenEdxLevelOfEducation>({
  [OpenEdxLevelOfEducation.MASTER_OR_PROFESSIONNAL_DEGREE]: {
    id: 'openEdxProfile.levelOfEducation.masterOrProfessionnalDegree',
    description:
      'Translation for level of education "master or professional degree" in openEdx profile',
    defaultMessage: 'Master',
  },
  [OpenEdxLevelOfEducation.PHD_OR_DOCTORATE]: {
    id: 'openEdxProfile.levelOfEducation.phdOrDoctorate',
    description: 'Translation for level of education "phd or doctorate" in openEdx profile',
    defaultMessage: 'PHD',
  },
  [OpenEdxLevelOfEducation.BACHELOR_DEGREE]: {
    id: 'openEdxProfile.levelOfEducation.bachelorDegree',
    description: 'Translation for level of education "bachelor degree" in openEdx profile',
    defaultMessage: 'Bachelor degree',
  },
  [OpenEdxLevelOfEducation.ASSOCIATE_DEGREE]: {
    id: 'openEdxProfile.levelOfEducation.associateDegree',
    description: 'Translation for level of education "associate degree" in openEdx profile',
    defaultMessage: 'Associate degree',
  },
  [OpenEdxLevelOfEducation.SECONDARY_OR_HIGH_SCHOOL]: {
    id: 'openEdxProfile.levelOfEducation.secondaryOrHighSchool',
    description: 'Translation for level of education "secondary or high school" in openEdx profile',
    defaultMessage: 'Secondary or high school',
  },
  [OpenEdxLevelOfEducation.JUNIOR_SECONDARY_OR_MIDDLE_SCHOOL]: {
    id: 'openEdxProfile.levelOfEducation.juniorSecondaryOrMiddleSchool',
    description:
      'Translation for level of education "junior secondary or middle school" in openEdx profile',
    defaultMessage: 'Junior secondary or middle school',
  },
  [OpenEdxLevelOfEducation.ELEMENTARY_PRIMARY_SCHOOL]: {
    id: 'openEdxProfile.levelOfEducation.elementaryPrimarySchool',
    description:
      'Translation for level of education "elementary primary school" in openEdx profile',
    defaultMessage: 'Elementary primary school',
  },
  [OpenEdxLevelOfEducation.NONE]: {
    id: 'openEdxProfile.levelOfEducation.none',
    description: 'Translation for level of education "none" in openEdx profile',
    defaultMessage: 'None',
  },
  [OpenEdxLevelOfEducation.OTHER]: {
    id: 'openEdxProfile.levelOfEducation.other',
    description: 'Translation for level of education "other" in openEdx profile',
    defaultMessage: 'Other',
  },
});

export const genderMessages = defineMessages<OpenEdxGender>({
  [OpenEdxGender.MALE]: {
    id: 'openEdxProfile.gender.male',
    description: 'Translation for gender "male" in openEdx profile',
    defaultMessage: 'Male',
  },
  [OpenEdxGender.FEMALE]: {
    id: 'openEdxProfile.gender.female',
    description: 'Translation for gender "female" in openEdx profile',
    defaultMessage: 'Female',
  },
  [OpenEdxGender.OTHER]: {
    id: 'openEdxProfile.gender.other',
    description: 'Translation for gender "other" in openEdx profile',
    defaultMessage: 'Other',
  },
});

export interface OpenEdxProfile {
  username: string;
  name: Maybe<string>;
  country: Maybe<string>;
  yearOfBirth: Maybe<string>;
  levelOfEducation: Maybe<string>;
  email: string;
  dateJoined: Maybe<string>;
  gender: Maybe<string>;
  language: Maybe<string>;
  favoriteLanguage: Maybe<string>;
}

export const parseOpenEdxApiProfile = (
  intl: IntlShape,
  data: OpenEdxApiProfile,
): OpenEdxProfile => {
  const [languageCode] = intl.locale.split('-');
  const languageNames = new Intl.DisplayNames([intl.locale], { type: 'language' });
  const parsedData = {
    username: data.username,
    name: data.name || undefined,
    email: data.email,
    yearOfBirth: data.year_of_birth || undefined,
    dateJoined: data.date_joined || undefined,
    levelOfEducation: data.level_of_education
      ? intl.formatMessage(levelOfEducationMessages[data.level_of_education])
      : undefined,
    gender: data.gender ? intl.formatMessage(genderMessages[data.gender]) : undefined,
    country: data.country ? countries.getName(data.country, languageCode) : undefined,
    language: data['pref-lang'] ? languageNames.of(data['pref-lang']) : undefined,
    favoriteLanguage: data.language_proficiencies.length
      ? languageNames.of(data.language_proficiencies[0].code)
      : undefined,
  };

  return parsedData;
};
