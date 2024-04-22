import { DehydratedState, hydrate } from '@tanstack/react-query';
import { UserFactory } from 'utils/test/factories/richie';
import { QueryStateFactory, PersistedClientFactory } from 'utils/test/factories/reactQuery';
import createQueryClient, { QueryClientOptions } from 'utils/react-query/createQueryClient';
import { User } from 'types/User';
import { Maybe, Nullable } from 'types/utils';
import { JoanieUserProfileFactory } from './factories/joanie';

export interface CreateTestQueryClientParams extends QueryClientOptions {
  user?: Maybe<Nullable<User | boolean>>;
  joanieUserProfile?: Maybe<Nullable<User>>;
  queriesCallback?: (queries: DehydratedState['queries']) => void;
}

const getUserToUser = (user: Maybe<Nullable<User | boolean>>) => {
  if (user === true) {
    return UserFactory().one();
  } else if (user) {
    return user;
  } else if (user === null) {
    return null;
  }
};

const getJoanieUserProfileToUser = (
  user: Nullable<User>,
  joanieUserProfile: Maybe<Nullable<User>>,
) => {
  if (user === null) {
    return null;
  }

  return JoanieUserProfileFactory({
    ...(joanieUserProfile || {}),
    username: user.username,
    full_name: user.full_name,
  }).one();
};

/**
 * user typeof User put user in cache.
 * user === true generates a user to put it in cache.
 * user === null puts null in cache.
 * user === false || user === undefined puts nothing in cache.
 *
 * @param params
 */
export const createTestQueryClient = (params: CreateTestQueryClientParams = {}) => {
  const userToUse = getUserToUser(params.user);

  const queries: DehydratedState['queries'] = [];
  if (userToUse !== undefined) {
    queries.push(QueryStateFactory(['user'], { data: userToUse }));
    if (userToUse !== null) {
      const joanieUserProfileToUser = getJoanieUserProfileToUser(
        userToUse,
        params.joanieUserProfile,
      );

      queries.push(
        QueryStateFactory(['user', 'profile', '{}'], {
          data: joanieUserProfileToUser,
        }),
      );
    }
  }

  params.queriesCallback?.(queries);

  const { clientState } = PersistedClientFactory({
    queries,
  });
  const client = createQueryClient(params);
  hydrate(client, clientState);

  return client;
};
