import React, { useEffect, useMemo } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { parse } from 'query-string';
import { location } from 'utils/indirection/window';
import { handle } from 'utils/errors/handle';
import { isSafeURI } from 'utils/isSafeURI';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  loggingOut: {
    defaultMessage: 'Logging out from Richie applications, please wait...',
    description: 'Message to precise the context of this page.',
    id: 'components.UserLogout.loggingOut',
  },
  helpMessage: {
    defaultMessage: 'If you are not automatically redirected',
    description: 'Message to help user in case of automatic redirect failure.',
    id: 'components.UserLogout.helpMessage',
  },
  helpCTA: {
    defaultMessage: 'back to home manually',
    description: 'Accessible CTA Label to help user in case of automatic redirect failure.',
    id: 'components.UserLogout.helpCTA',
  },
});

interface UserLogoutProps {
  logoutUrls: string[];
  logoutRedirectUrl: string;
}

export const UserLogout = ({ logoutUrls, logoutRedirectUrl }: UserLogoutProps) => {
  const { next } = useMemo(() => parse(location.search), [location.search]);
  const redirectTo = useMemo(
    () => (typeof next === 'string' && isSafeURI(next) ? next : logoutRedirectUrl),
    [next],
  );

  useEffect(() => {
    let delta = Date.now();
    // Call all logout endpoint provided
    const queue = [
      ...logoutUrls.map((url) =>
        fetch(url, {
          credentials: 'include',
          mode: 'no-cors',
        }),
      ),
    ];

    Promise.allSettled(queue).then((results) => {
      delta = Date.now() - delta;

      /*
        In order to not confuse user,
        if requests finished too fast, we wait a little amount of time (max 1.5s)
        before redirect to the next page
      */
      setTimeout(() => {
        // location.replace(redirectTo);
      }, Math.max(1500 - delta, 0));

      results.forEach((result) => {
        if (result.status === 'rejected') {
          handle(result.reason);
        }
      });
    });
  }, []);

  return (
    <div className="user-logout">
      <Spinner size="large" />
      <h6>
        <FormattedMessage {...messages.loggingOut} />
      </h6>
      <p className="logout--helper">
        <FormattedMessage {...messages.helpMessage} />,{' '}
        <a href={redirectTo}>
          <FormattedMessage {...messages.helpCTA} />
        </a>
        .
      </p>
    </div>
  );
};
