import React, { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Spinner } from 'components/Spinner';
import { User } from 'types/User';
import { handle } from 'utils/errors/handle';
import { Maybe, Nullable } from 'utils/types';
import { useAsyncEffect } from 'utils/useAsyncEffect';

const messages = defineMessages({
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
  loginUrl: string;
  logoutUrl: string;
  signupUrl: string;
}

export const UserLogin = ({
  loginUrl,
  logoutUrl,
  signupUrl,
}: UserLoginProps) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const [user, setUser] = useState<Maybe<Nullable<User>>>(undefined);

  useAsyncEffect(async () => {
    try {
      const response = await fetch('/api/v1.0/users/whoami/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // 401 is the expected response for anonymous users
        if (response.status === 401) {
          return setUser(null); // null means anonymous user
        }
        // Push remote errors to the error channel for consistency
        throw new Error('Failed to get current user.');
      }

      const content = await response.json();
      setUser(content);
    } catch (error) {
      // Default to the "anonymous user" state to enable loggging in anyway
      setUser(null);
      handle(error);
    }
  }, []);

  return (
    <div className="user-login">
      {user === undefined ? (
        <Spinner size="small">
          <FormattedMessage {...messages.spinnerText} />
        </Spinner>
      ) : user === null ? (
        <React.Fragment>
          <a
            href={signupUrl}
            className="button button--secondary user-login__btn user-login__btn--sign-up"
          >
            <FormattedMessage {...messages.signUp} />
          </a>
          <a
            href={loginUrl}
            className="button button--secondary-hollow user-login__btn user-login__btn--log-in"
          >
            <FormattedMessage {...messages.logIn} />
          </a>
        </React.Fragment>
      ) : (
        <div className="user-login__logged">
          <div className="user-login__logged__name">{user.full_name}</div>{' '}
          <a href={logoutUrl} className="button button--secondary-hollow">
            <FormattedMessage {...messages.logOut} />
          </a>
        </div>
      )}
    </div>
  );
};
