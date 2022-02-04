/* eslint-disable no-nested-ternary */
import { Fragment } from 'react';
import { defineMessages, FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';

import { Spinner } from 'components/Spinner';
import { UserMenu } from 'components/UserMenu';
import { useSession } from 'data/SessionProvider';
import { CommonDataProps } from 'types/commonDataProps';

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
            <svg aria-hidden={true} role="img" className="icon">
              <use xlinkHref="#icon-login" />
            </svg>
            <FormattedMessage {...messages.logIn} />
          </button>
        </Fragment>
      ) : (
        <UserMenu
          // If user's fullname is empty, we use its username as a fallback
          user={{
            ...user,
            urls: [
              ...Object.entries(profileUrls).map(([key, { label, action }]) => ({
                key,
                label,
                action: typeof action === 'string' ? bindUserDataToUrl(action, user) : action,
              })),
              {
                key: 'logout',
                label: intl.formatMessage(messages.logOut),
                action: destroy,
              },
            ],
          }}
        />
      )}
    </div>
  );
};

export default UserLogin;
