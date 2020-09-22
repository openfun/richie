import React, { useCallback } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { useUser } from 'data/useSession';
import { Spinner } from 'components/Spinner';
import { UserMenu } from 'components/UserMenu';
import { handle } from 'utils/errors/handle';
import { useAsyncEffect } from 'utils/useAsyncEffect';
import { location } from 'utils/indirection/window';
import { CommonDataProps } from 'types/commonDataProps';

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
  oAuth2WhoamiUrl?: string;
}

export const UserLogin = ({
  loginUrl,
  logoutUrl,
  signupUrl,
  oAuth2WhoamiUrl,
}: UserLoginProps & CommonDataProps) => {
  /**
   * `user` is:
   * - `undefined` when we have not made the `whoami` request yet;
   * - `null` when the user is anonymous or the request failed;
   * - a user object when the user is logged in.
   */
  const [user, setUser, destroySession] = useUser();
  const intl = useIntl();

  const destroySessionThenGoTo = useCallback(
    (url) => {
      destroySession();
      location.replace(url);
    },
    [location, destroySession],
  );

  useAsyncEffect(async () => {
    if (user === undefined) {
      try {
        let response = await fetch('/api/v1.0/users/whoami/', { credentials: 'include' });

        if (response.ok) {
          const content = await response.json();
          return setUser(content);
        }

        // 401 is the expected response for anonymous users
        if (response.status === 401) {
          if (oAuth2WhoamiUrl) {
            // If an endpoint to check if user is logged in on oauth2 provider exists, check that.
            response = await fetch(oAuth2WhoamiUrl, { credentials: 'include' });
            // If user is already logged in on oauth2 provider, we call automatically the login url
            if (response.ok) {
              return destroySessionThenGoTo(loginUrl);
            } else if (response.status !== 401) {
              throw new Error('Failed to reach OAuth2 Whoami endpoint.');
            }
          }
          return setUser(null);
        }
        // Push remote errors to the error channel for consistency
        throw new Error('Failed to get current user.');
      } catch (error) {
        // Default to the "anonymous user" state to enable logging in anyway
        setUser(null);
        handle(error);
      }
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
          <button
            onClick={() => destroySessionThenGoTo(signupUrl)}
            className="user-login__btn user-login__btn--sign-up"
          >
            <FormattedMessage {...messages.signUp} />
          </button>
          <button
            onClick={() => destroySessionThenGoTo(loginUrl)}
            className="user-login__btn user-login__btn--log-in"
          >
            <svg aria-hidden={true} role="img" className="icon">
              <use xlinkHref="#icon-login" />
            </svg>
            <FormattedMessage {...messages.logIn} />
          </button>
        </React.Fragment>
      ) : (
        <UserMenu
          // If user's fullname is empty, we use its username as a fallback
          user={user.full_name || user.username}
          links={[...user.urls, { label: intl.formatMessage(messages.logOut), href: logoutUrl }]}
        />
      )}
    </div>
  );
};
