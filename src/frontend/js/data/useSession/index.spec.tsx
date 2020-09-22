import React, { useEffect } from 'react';
import { act, render } from '@testing-library/react';
import { User } from 'types/User';
import { Nullable } from 'utils/types';

import { serializeSession, SessionProvider, useUser } from '.';

jest.useFakeTimers();

interface FakeUserLoginProps {
  whoamiContent: Nullable<User>;
}

describe('useSession', () => {
  let getHooksValues: any;
  const fakeUser = {
    full_name: 'John Doe',
    username: 'johndoe',
    urls: [],
  };

  const FakeUserLogin = ({ whoamiContent }: FakeUserLoginProps) => {
    const [user, setUser, destroySession] = useUser();
    getHooksValues = () => ({ user, setUser, destroySession });

    useEffect(() => {
      if (user === undefined) {
        setTimeout(() => {
          setUser(whoamiContent);
        }, 1000);
      }
    }, []);

    return null;
  };

  beforeEach(() => {
    jest.clearAllTimers();
    sessionStorage.clear();
  });

  it('returns an undefined user when no session exists', () => {
    render(
      <SessionProvider>
        <FakeUserLogin whoamiContent={null} />
      </SessionProvider>,
    );

    expect(getHooksValues().user).toBeUndefined();
  });

  it('returns a nullish user when user is not logged in', () => {
    render(
      <SessionProvider>
        <FakeUserLogin whoamiContent={null} />
      </SessionProvider>,
    );

    expect(getHooksValues().user).toBeUndefined();
    act(() => {
      jest.runAllTimers();
    });

    expect(getHooksValues().user).toBeNull();
  });

  it('returns an user when user is logged in', () => {
    render(
      <SessionProvider>
        <FakeUserLogin whoamiContent={fakeUser} />
      </SessionProvider>,
    );

    expect(getHooksValues().user).toBeUndefined();

    act(() => {
      jest.runAllTimers();
    });

    expect(getHooksValues().user).toStrictEqual({
      full_name: 'John Doe',
      username: 'johndoe',
      urls: [],
    });
  });

  it('returns last user state in session if session has not expired', () => {
    sessionStorage.setItem(
      'user_session',
      serializeSession({
        user: fakeUser,
        expiredAt: Date.now() + 60000,
      }),
    );

    render(
      <SessionProvider>
        <FakeUserLogin whoamiContent={fakeUser} />
      </SessionProvider>,
    );

    expect(getHooksValues().user).toStrictEqual({
      full_name: 'John Doe',
      username: 'johndoe',
      urls: [],
    });
  });

  it('returns an undefined user if session has expired', () => {
    sessionStorage.setItem(
      'user_session',
      serializeSession({
        user: fakeUser,
        expiredAt: Date.now() - 60000,
      }),
    );

    render(
      <SessionProvider>
        <FakeUserLogin whoamiContent={fakeUser} />
      </SessionProvider>,
    );

    expect(getHooksValues().user).toBeUndefined();
    act(() => {
      jest.runAllTimers();
    });

    expect(getHooksValues().user).toStrictEqual({
      full_name: 'John Doe',
      username: 'johndoe',
      urls: [],
    });
  });

  it('destroys session', () => {
    sessionStorage.setItem(
      'user_session',
      serializeSession({
        user: fakeUser,
        expiredAt: Date.now() + 60000,
      }),
    );

    render(
      <SessionProvider>
        <FakeUserLogin whoamiContent={fakeUser} />
      </SessionProvider>,
    );

    expect(getHooksValues().user).toStrictEqual({
      full_name: 'John Doe',
      username: 'johndoe',
      urls: [],
    });

    act(() => {
      getHooksValues().destroySession();
    });

    expect(getHooksValues().user).toBeUndefined();
  });
});
