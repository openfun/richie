import { DehydratedState, hydrate } from '@tanstack/react-query';
import * as mockFactories from 'utils/test/factories';
import createQueryClient, { QueryClientOptions } from 'utils/react-query/createQueryClient';
import { User } from 'types/User';
import { Maybe, Nullable } from 'types/utils';

interface Params extends QueryClientOptions {
  user?: Maybe<Nullable<User | boolean>>;
}

/**
 * user typeof User put user in cache.
 * user === true generates a user to put it in cache.
 * user === null puts null in cache.
 * user === false || user === undefined puts nothing in cache.
 *
 * @param params
 */
export const createTestQueryClient = (params?: Params) => {
  let userToUse: Maybe<Nullable<User>>;
  if (params?.user === true) {
    userToUse = mockFactories.UserFactory.generate();
  } else if (params?.user) {
    userToUse = params.user as User;
  } else if (params?.user === null) {
    userToUse = null;
  }

  const queries: DehydratedState['queries'] = [];
  if (userToUse || userToUse === null) {
    queries.push(mockFactories.QueryStateFactory(['user'], { data: userToUse }));
  }

  const { clientState } = mockFactories.PersistedClientFactory({
    queries,
  });
  const client = createQueryClient(params);
  hydrate(client, clientState);

  return client;
};
