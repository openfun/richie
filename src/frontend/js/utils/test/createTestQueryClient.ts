import { DehydratedState, hydrate } from '@tanstack/react-query';
import { UserFactory } from 'utils/test/factories/richie';
import { QueryStateFactory, PersistedClientFactory } from 'utils/test/factories/reactQuery';
import createQueryClient, { QueryClientOptions } from 'utils/react-query/createQueryClient';
import { User } from 'types/User';
import { Maybe, Nullable } from 'types/utils';

export interface CreateTestQueryClientParams extends QueryClientOptions {
  user?: Maybe<Nullable<User | boolean>>;
  queriesCallback?: (queries: DehydratedState['queries']) => void;
}

/**
 * user typeof User put user in cache.
 * user === true generates a user to put it in cache.
 * user === null puts null in cache.
 * user === false || user === undefined puts nothing in cache.
 *
 * @param params
 */
export const createTestQueryClient = (params: CreateTestQueryClientParams = {}) => {
  let userToUse: Maybe<Nullable<User>>;
  if (params.user === true) {
    userToUse = UserFactory().one();
  } else if (params.user) {
    userToUse = params.user;
  } else if (params.user === null) {
    userToUse = null;
  }

  const queries: DehydratedState['queries'] = [];
  if (userToUse !== undefined) {
    queries.push(QueryStateFactory(['user'], { data: userToUse }));
  }

  params.queriesCallback?.(queries);

  const { clientState } = PersistedClientFactory({
    queries,
  });
  const client = createQueryClient(params);
  hydrate(client, clientState);

  return client;
};
