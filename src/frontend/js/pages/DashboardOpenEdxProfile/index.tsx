import { Button, Input } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useSession } from 'contexts/SessionContext';
import useOpenEdxProfile from 'hooks/useOpenEdxProfile';
import { DashboardBox } from 'widgets/Dashboard/components/DashboardBox';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import Form from 'components/Form';
import context from 'utils/context';
import Banner, { BannerType } from 'components/Banner';
import { REACT_QUERY_SETTINGS } from 'settings';

const messages = defineMessages({
  // page elements
  sectionHeader: {
    id: 'components.DashboardOpenEdxProfile.header',
    description: 'Title of the dashboard open edx profile block',
    defaultMessage: 'Profile',
  },
  baseInformationHeader: {
    id: 'components.DashboardOpenEdxProfile.baseInformationHeader',
    description: 'Title of the open edx profile form "basic information" block',
    defaultMessage: 'Basic account information',
  },
  additionalInformationHeader: {
    id: 'components.DashboardOpenEdxProfile.additionalInformationHeader',
    description: 'Title of the open edx profile form "additional information" block',
    defaultMessage: 'Additional account information',
  },
  editButtonLabel: {
    id: 'components.DashboardOpenEdxProfile.EditButtonLabel',
    description: 'Label of the edit button link of the open edx profile form',
    defaultMessage: 'Edit your profile',
  },

  // base informations form
  usernameInputLabel: {
    id: 'components.DashboardOpenEdxProfile.usernameInputLabel',
    description: 'Label of the openEdx profile "username" input',
    defaultMessage: 'Username',
  },
  fullNameInputLabel: {
    id: 'components.DashboardOpenEdxProfile.fullNameInputLabel',
    description: 'Label of the openEdx profile "fullName" input',
    defaultMessage: 'Full name',
  },
  emailInputLabel: {
    id: 'components.DashboardOpenEdxProfile.emailInputLabel',
    description: 'Label of the openEdx profile "email" input',
    defaultMessage: 'Email',
  },
  languageInputLabel: {
    id: 'components.DashboardOpenEdxProfile.languageInputLabel',
    description: 'Label of the openEdx profile "langue" input',
    defaultMessage: 'Langue',
  },
  countryInputLabel: {
    id: 'components.DashboardOpenEdxProfile.countryInputLabel',
    description: 'Label of the openEdx profile "country" input',
    defaultMessage: 'Country',
  },

  // additional informations form
  levelOfEducationInputLabel: {
    id: 'components.DashboardOpenEdxProfile.levelOfEducationInputLabel',
    description: 'Label of the openEdx profile "level of education" input',
    defaultMessage: 'Level of education',
  },
  genderInputLabel: {
    id: 'components.DashboardOpenEdxProfile.genderInputLabel',
    description: 'Label of the openEdx profile "gender" input',
    defaultMessage: 'Sex',
  },
  yearOfBirthInputLabel: {
    id: 'components.DashboardOpenEdxProfile.yearOfBirthInputLabel',
    description: 'Label of the openEdx profile "year of birth" input',
    defaultMessage: 'Year of birth',
  },
  favoriteLanguageInputLabel: {
    id: 'components.DashboardOpenEdxProfile.favoriteLanguageInputLabel',
    description: 'Label of the openEdx profile "favorite language" input',
    defaultMessage: 'Favorite language',
  },

  // form fields descriptions
  usernameInputDescription: {
    id: 'components.DashboardOpenEdxProfile.usernameInputDescription',
    description: 'Description of the openEdx profile "username" input',
    defaultMessage: 'Your name on FUN-MOOC. You cannot change your username.',
  },
  fullNameInputDescription: {
    id: 'components.DashboardOpenEdxProfile.fullNameInputDescription',
    description: 'Description of the openEdx profile "fullName" input',
    defaultMessage:
      'The name that appears on your certificates and training agreements. Other learners never see your full name',
  },
  emailInputDescription: {
    id: 'components.DashboardOpenEdxProfile.emailInputDescription',
    description: 'Description of the openEdx profile "email" input',
    defaultMessage:
      'Email used when sign-up, FUN-MOOC and leasons communications will be sent at this address',
  },
  languageInputDescription: {
    id: 'components.DashboardOpenEdxProfile.languageInputDescription',
    description: 'Description of the openEdx profile "langue" input',
    defaultMessage: 'The language used on the website. The website languages are limitated.',
  },
});

export const DEFAULT_DISPLAYED_FORM_VALUE = ' - ';

const DashboardOpenEdxProfile = () => {
  const intl = useIntl();
  const { user } = useSession();

  const { data: openEdxProfileData, error } = useOpenEdxProfile({ username: user!.username });

  const onClickModifyProfile = () => {
    sessionStorage.removeItem(REACT_QUERY_SETTINGS.cacheStorage.key);
  };

  if (error) {
    return (
      <DashboardCard header={<FormattedMessage {...messages.sectionHeader} />}>
        <Banner type={BannerType.ERROR} message={error} />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard header={<FormattedMessage {...messages.sectionHeader} />}>
      <DashboardBox.List>
        <DashboardBox header={<FormattedMessage {...messages.baseInformationHeader} />}>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="username"
              label={intl.formatMessage(messages.usernameInputLabel)}
              disabled={true}
              value={openEdxProfileData?.username || DEFAULT_DISPLAYED_FORM_VALUE}
              text={intl.formatMessage(messages.usernameInputDescription)}
            />
          </Form.Row>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="fullName"
              label={intl.formatMessage(messages.fullNameInputLabel)}
              disabled={true}
              value={openEdxProfileData?.name || DEFAULT_DISPLAYED_FORM_VALUE}
              text={intl.formatMessage(messages.fullNameInputDescription)}
            />
          </Form.Row>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="email"
              label={intl.formatMessage(messages.emailInputLabel)}
              disabled={true}
              value={openEdxProfileData?.email || DEFAULT_DISPLAYED_FORM_VALUE}
              text={intl.formatMessage(messages.emailInputDescription)}
            />
          </Form.Row>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="language"
              label={intl.formatMessage(messages.languageInputLabel)}
              disabled={true}
              value={openEdxProfileData?.language || DEFAULT_DISPLAYED_FORM_VALUE}
              text={intl.formatMessage(messages.languageInputDescription)}
            />
          </Form.Row>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="country"
              label={intl.formatMessage(messages.countryInputLabel)}
              disabled={true}
              value={openEdxProfileData?.country || DEFAULT_DISPLAYED_FORM_VALUE}
            />
          </Form.Row>
        </DashboardBox>
        <DashboardBox header={<FormattedMessage {...messages.additionalInformationHeader} />}>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="levelOfEducation"
              label={intl.formatMessage(messages.levelOfEducationInputLabel)}
              disabled={true}
              value={openEdxProfileData?.levelOfEducation || DEFAULT_DISPLAYED_FORM_VALUE}
            />
          </Form.Row>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="gender"
              label={intl.formatMessage(messages.genderInputLabel)}
              disabled={true}
              value={openEdxProfileData?.gender || DEFAULT_DISPLAYED_FORM_VALUE}
            />
          </Form.Row>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="yearOfBirth"
              label={intl.formatMessage(messages.yearOfBirthInputLabel)}
              disabled={true}
              value={openEdxProfileData?.yearOfBirth || DEFAULT_DISPLAYED_FORM_VALUE}
            />
          </Form.Row>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="favoriteLanguage"
              label={intl.formatMessage(messages.favoriteLanguageInputLabel)}
              disabled={true}
              value={openEdxProfileData?.favoriteLanguage || DEFAULT_DISPLAYED_FORM_VALUE}
            />
          </Form.Row>
        </DashboardBox>
      </DashboardBox.List>

      <Form.Footer>
        <Button
          fullWidth
          onClick={onClickModifyProfile}
          href={`${context.authentication.endpoint}/account/settings`}
        >
          <FormattedMessage {...messages.editButtonLabel} />
        </Button>
      </Form.Footer>
    </DashboardCard>
  );
};
export default DashboardOpenEdxProfile;
