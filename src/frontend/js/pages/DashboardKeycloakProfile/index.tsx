import { Button, Input } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useSession } from 'contexts/SessionContext';
import { DashboardBox } from 'widgets/Dashboard/components/DashboardBox';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import Form from 'components/Form';
import { AuthenticationApi } from 'api/authentication';
import { KeycloakAccountApi } from 'types/api';

const messages = defineMessages({
  sectionHeader: {
    id: 'components.DashboardKeycloakProfile.header',
    description: 'Title of the dashboard keycloak profile block',
    defaultMessage: 'Profile',
  },
  accountInformationHeader: {
    id: 'components.DashboardKeycloakProfile.accountInformationHeader',
    description: 'Title of the keycloak profile form "account information" block',
    defaultMessage: 'Account information',
  },
  editButtonLabel: {
    id: 'components.DashboardKeycloakProfile.editButtonLabel',
    description: 'Label of the edit button link of the keycloak profile',
    defaultMessage: 'Edit your profile',
  },
  usernameInputLabel: {
    id: 'components.DashboardKeycloakProfile.usernameInputLabel',
    description: 'Label of the keycloak profile "username" input',
    defaultMessage: 'Account name',
  },
  usernameInputDescription: {
    id: 'components.DashboardKeycloakProfile.usernameInputDescription',
    description: 'Description of the keycloak profile "username" input',
    defaultMessage: 'This name will be used in legal documents.',
  },
  emailInputLabel: {
    id: 'components.DashboardKeycloakProfile.emailInputLabel',
    description: 'Label of the keycloak profile "email" input',
    defaultMessage: 'Account email',
  },
  emailInputDescription: {
    id: 'components.DashboardKeycloakProfile.emailInputDescription',
    description: 'Description of the keycloak profile "email" input',
    defaultMessage: 'This email will be used to send you confirmation mails.',
  },
});

export const DEFAULT_DISPLAYED_FORM_VALUE = ' - ';

const DashboardKeycloakProfile = () => {
  const intl = useIntl();
  const { user } = useSession();
  const accountApi = AuthenticationApi!.account as KeycloakAccountApi;

  return (
    <DashboardCard header={<FormattedMessage {...messages.sectionHeader} />}>
      <DashboardBox.List>
        <DashboardBox header={<FormattedMessage {...messages.accountInformationHeader} />}>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="username"
              label={intl.formatMessage(messages.usernameInputLabel)}
              disabled={true}
              value={user?.username || DEFAULT_DISPLAYED_FORM_VALUE}
              text={intl.formatMessage(messages.usernameInputDescription)}
            />
          </Form.Row>
          <Form.Row>
            <Input
              className="form-field"
              fullWidth
              name="email"
              label={intl.formatMessage(messages.emailInputLabel)}
              disabled={true}
              value={user?.email || DEFAULT_DISPLAYED_FORM_VALUE}
              text={intl.formatMessage(messages.emailInputDescription)}
            />
          </Form.Row>
        </DashboardBox>
      </DashboardBox.List>

      <Form.Footer>
        <Button fullWidth href={accountApi.updateUrl()}>
          <FormattedMessage {...messages.editButtonLabel} />
        </Button>
      </Form.Footer>
    </DashboardCard>
  );
};
export default DashboardKeycloakProfile;
