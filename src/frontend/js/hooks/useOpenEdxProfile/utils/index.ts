import { IntlShape, defineMessages } from 'react-intl';
import countries from 'i18n-iso-countries';
import { Gender, LevelOfEducation, OpenEdxApiProfile } from 'types/openEdx';
import { Maybe } from 'types/utils';

const levelOfEducationMessages = defineMessages<LevelOfEducation>({
  [LevelOfEducation.MASTER_OR_PROFESSIONNAL_DEGREE]: {
    id: 'openEdxProfile.levelOfEducation.masterOrProfessionnalDegree',
    description:
      'Translation for level of education "master or professional degree" in openEdx profile',
    defaultMessage: 'Master',
  },
  [LevelOfEducation.PHD_OR_DOCTORATE]: {
    id: 'openEdxProfile.levelOfEducation.phdOrDoctorate',
    description: 'Translation for level of education "phd or doctorate" in openEdx profile',
    defaultMessage: 'PHD',
  },
  [LevelOfEducation.BACHELOR_DEGREE]: {
    id: 'openEdxProfile.levelOfEducation.bachelorDegree',
    description: 'Translation for level of education "bachelor degree" in openEdx profile',
    defaultMessage: 'Bachelor degree',
  },
  [LevelOfEducation.ASSOCIATE_DEGREE]: {
    id: 'openEdxProfile.levelOfEducation.associateDegree',
    description: 'Translation for level of education "associate degree" in openEdx profile',
    defaultMessage: 'Associate degree',
  },
  [LevelOfEducation.SECONDARY_OR_HIGH_SCHOOL]: {
    id: 'openEdxProfile.levelOfEducation.secondaryOrHighSchool',
    description: 'Translation for level of education "secondary or high school" in openEdx profile',
    defaultMessage: 'Secondary or high school',
  },
  [LevelOfEducation.JUNIOR_SECONDARY_OR_MIDDLE_SCHOOL]: {
    id: 'openEdxProfile.levelOfEducation.juniorSecondaryOrMiddleSchool',
    description:
      'Translation for level of education "junior secondary or middle school" in openEdx profile',
    defaultMessage: 'Junior secondary or middle school',
  },
  [LevelOfEducation.ELEMENTARY_PRIMARY_SCHOOL]: {
    id: 'openEdxProfile.levelOfEducation.elementaryPrimarySchool',
    description:
      'Translation for level of education "elementary primary school" in openEdx profile',
    defaultMessage: 'Elementary primary school',
  },
  [LevelOfEducation.NONE]: {
    id: 'openEdxProfile.levelOfEducation.none',
    description: 'Translation for level of education "none" in openEdx profile',
    defaultMessage: 'None',
  },
  [LevelOfEducation.OTHER]: {
    id: 'openEdxProfile.levelOfEducation.other',
    description: 'Translation for level of education "other" in openEdx profile',
    defaultMessage: 'Other',
  },
});

const genderMessages = defineMessages<Gender>({
  [Gender.MALE]: {
    id: 'openEdxProfile.gender.male',
    description: 'Translation for gender "male" in openEdx profile',
    defaultMessage: 'Male',
  },
  [Gender.FEMALE]: {
    id: 'openEdxProfile.gender.female',
    description: 'Translation for gender "female" in openEdx profile',
    defaultMessage: 'Female',
  },
  [Gender.OTHER]: {
    id: 'openEdxProfile.gender.other',
    description: 'Translation for gender "other" in openEdx profile',
    defaultMessage: 'Other',
  },
});

export interface OpenEdxProfile {
  username: Maybe<string>;
  name: Maybe<string>;
  country: Maybe<string>;
  yearOfBirth: Maybe<string>;
  levelOfEducation: Maybe<string>;
  email: Maybe<string>;
  dateJoined: Maybe<Date>;
  gender: Maybe<string>;
  language: Maybe<string>;
  favoriteLanguage: Maybe<string>;
}

export const parseOpenEdxApiProfile = (
  intl: IntlShape,
  data?: OpenEdxApiProfile,
): OpenEdxProfile => {
  const [languageCode] = intl.locale.split('-');
  const defaultValues: OpenEdxProfile = {
    username: undefined,
    name: undefined,
    email: undefined,
    language: undefined,
    country: undefined,
    levelOfEducation: undefined,
    gender: undefined,
    yearOfBirth: undefined,
    favoriteLanguage: undefined,
    dateJoined: undefined,
  };

  const languageNames = new Intl.DisplayNames([intl.locale], { type: 'language' });
  const parsedData = data
    ? {
        username: data.username,
        name: data.name,
        email: data.email,
        yearOfBirth: data.year_of_birth,
        dateJoined: new Date(data.date_joined),
        levelOfEducation:
          data.level_of_education !== null
            ? intl.formatMessage(levelOfEducationMessages[data.level_of_education])
            : undefined,
        gender: data.gender !== null ? intl.formatMessage(genderMessages[data.gender]) : undefined,
        country: data.country ? countries.getName(data.country, languageCode) : undefined,
        language: data['pref-lang'] ? languageNames.of(data['pref-lang']) : undefined,
        favoriteLanguage: data.language_proficiencies.length
          ? languageNames.of(data.language_proficiencies[0].code)
          : undefined,
      }
    : defaultValues;

  return parsedData;
};
