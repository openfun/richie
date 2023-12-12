/* eslint-disable no-nested-ternary */
import { Fragment, useMemo } from 'react';
import { defineMessages, FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';

import { Spinner } from 'components/Spinner';
import { Icon, IconTypeEnum } from 'components/Icon';
import { useSession } from 'contexts/SessionContext';
import { CommonDataProps } from 'types/commonDataProps';
import { abilityActions } from 'utils/AbilitiesHelper';
import { useJoanieUserAbilities } from 'hooks/useJoanieUserAbilities';
import { UserMenu, UserMenuItem } from './components/UserMenu';

const messages: { [key: string]: MessageDescriptor } = defineMessages({
  logIn: {
    defaultMessage: 'Log in',
    description: 'Text for the login button.',
    id: 'components.UserLogin.logIn',
  },
  logOut: {
    defaultMessage: 'Log out',
    description: 'Text for the logout button.',
    id: 'components.UserLogin.logOut',
  },
  signUp: {
    defaultMessage: 'Sign up',
    description: 'Text for the signup button.',
    id: 'components.UserLogin.signup',
  },
  spinnerText: {
    defaultMessage: 'Loading login status...',
    description: 'Accessibility text for the spinner in the login area.',
    id: 'components.UserLogin.spinnerText',
  },
});

interface UserLoginProps {
  context: CommonDataProps['context'];
  profileUrls?: {
    [key: string]: {
      action: string | (() => void);
      label: string;
    };
  };
}

/*
  bindUserDataToUrl

  @param url an url defined in profileUrls prop
  @param user the loggedin user

  Profile urls are just strings provided by the backend then consumed by the frontend to display
  custom links in user menu. In some case, these urls may require user dynamic fields.
  So this is why, it is possible to define a dynamic fields by wrapping field name into parentheses.
  bindUserDataToUrl function aims to match these dynamic
  fields then bind it with corresponding user data.

  e.g:
  In backend, a profile url can be written as following: /profile/(username)
  Then from frontend, this string is parsed and match (<dynamic_field>) pattern
  So the provided /profile/(username) string will be transform into /profile/johndoe
*/
const REGEXP_PROFILE_URL = /\((?<prop>[a-zA-Z0-9-_]*)\)/g;
const bindUserDataToUrl = (url: string, user: any) =>
  url.replace(REGEXP_PROFILE_URL, (match: string, prop: string): string =>
    typeof user[prop] === 'string' ? user[prop] : match,
  );

const UserLogin = ({ profileUrls = {} }: UserLoginProps) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const { user, destroy, login, register } = useSession();
  const intl = useIntl();
  const joanieUserAbilities = useJoanieUserAbilities();

  const unauthorizedUrlFilter = (urlItem: UserMenuItem) => {
    if (urlItem.key === 'dashboard_teacher') {
      return !!joanieUserAbilities?.can(abilityActions.ACCESS_TEACHER_DASHBOARD);
    }
    return true;
  };

  const userMenuItems = useMemo(() => {
    if (user) {
      return [
        ...Object.entries(profileUrls)
          .map(([key, { label, action }]) => ({
            key,
            label,
            action: typeof action === 'string' ? bindUserDataToUrl(action, user) : action,
          }))
          .filter(unauthorizedUrlFilter),
        {
          key: 'logout',
          label: intl.formatMessage(messages.logOut),
          action: destroy,
        },
      ];
    }
    return [];
  }, [user, joanieUserAbilities]);

  return (
    <div className="user-login">
      {user === undefined ? (
        <Spinner size="small">
          <FormattedMessage {...messages.spinnerText} />
        </Spinner>
      ) : user === null ? (
        <Fragment>
          <button onClick={register} className="user-login__btn user-login__btn--sign-up">
            <FormattedMessage {...messages.signUp} />
          </button>
          <button onClick={login} className="user-login__btn user-login__btn--log-in">
            <Icon name={IconTypeEnum.LOGIN} size="small" />
            <FormattedMessage {...messages.logIn} />
          </button>
        </Fragment>
      ) : (
        <UserMenu
          user={{
            ...user,
            urls: userMenuItems,
          }}
        />
      )}
    </div>
  );
};

export default UserLogin;
