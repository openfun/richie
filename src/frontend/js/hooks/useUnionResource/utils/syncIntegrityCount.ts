import { PaginatedResourceQuery } from 'types/Joanie';
import { FetchEntityData, fetchEntities } from './fetchEntities';
import { FetchEntityBaseArgs, QueryConfig } from './fetchEntity';
import { hasIntegrity } from './hasIntegrity';
import { log } from './log';

interface SyncIntegrityCountArgs<DataA, DataB, FiltersA, FiltersB> extends FetchEntityBaseArgs {
  stack: (DataA | DataB)[];
  integrityCount: number;
  newIntegrityCount: number;
  queryAConfig: QueryConfig<DataA, FiltersA>;
  queryBConfig: QueryConfig<DataB, FiltersB>;
}
interface SyncIntegrityCountSuccess<DataA, DataB> {
  totalCount: number;
  page: number;
  stack: (DataA | DataB)[];
  integrityCount: number;
  isGetError: false;
}
interface SyncIntegrityCountError<DataA, DataB> {
  isGetError: true;
  totalCount: number;
  page: number;
  stack: (DataA | DataB)[];
  integrityCount: number;
}

/**
 * This hook is used to fetch two different paginated resources from the API.
 *
 * The goals are:
 * - We want a stack of all fetched items
 * - We want to guarantee that the [0, integrityCount] slice of has integrity
 * ( By integrity, we mean that no matters futures fetches, the slice will always be the same )
 * - We want to provide ( via data ) the slice [0, cursor] of the stack with integrity
 *
 * The algorithm of integrity building is:
 * - Fetch page P of DataA and DataB, merge them, and sort them. We call it `previousStack`
 * - Fetch page P+1 of DataA and DataB, merge them, and sort them. We call it `currentStack`
 * - If `previousStack` and `currentStack` are equal on [0, newIntegrityCount],
 *    we can say that the integrity is verified over [0, newIntegrityCount], because it means this
 *    portion will never change over futures fetches ( due to consistent sorting ).
 * - If not, then loop over the next pages until we find the integrity.
 * - Then provide the slice [0, newIntegrityCount] of the stack with integrity via data.
 * - NB: If previousStack and currentStack have the same length, it means that we fetched all
 *    entities, so we can say that the integrity is verified over [0, totalCount] by definition.
 *
 */
export const syncIntegrityCount = async <
  DataA extends FetchEntityData,
  DataB extends FetchEntityData,
  FiltersA extends PaginatedResourceQuery = PaginatedResourceQuery,
  FiltersB extends PaginatedResourceQuery = PaginatedResourceQuery,
>({
  stack,
  newIntegrityCount,
  queryAConfig,
  queryBConfig,
  page,
  perPage,
  eofQueryKey,
  eofRef,
  queryClient,
}: SyncIntegrityCountArgs<DataA, DataB, FiltersA, FiltersB>): Promise<
  SyncIntegrityCountSuccess<DataA, DataB> | SyncIntegrityCountError<DataA, DataB>
> => {
  log('We want integrity', newIntegrityCount);

  let pageToLoad = page;
  let previousStack = [...stack];
  let currentStack: (DataA | DataB)[];
  let totalCount;
  let integrityCount;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    pageToLoad += 1;
    currentStack = [...previousStack];
    log('Fetching page ' + pageToLoad + ' ...');

    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetchEntities<DataA, DataB, FiltersA, FiltersB>({
        stack: currentStack,
        queryAConfig,
        queryBConfig,
        page: pageToLoad,
        perPage,
        eofQueryKey,
        eofRef,
        queryClient,
      });
      if (totalCount === undefined) {
        totalCount = res.totalCount;
      }
      currentStack = res.stack;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      return Promise.resolve({
        isGetError: true,
        totalCount: totalCount || 0,
        integrityCount: integrityCount || 0,
        page: pageToLoad,
        stack: currentStack,
      });
    }

    log(
      'hasIntegrity',
      'previous',
      previousStack.length,
      'current',
      currentStack.length,
      'totalCount',
      totalCount,
    );

    // Having the same length means that we reached the end of the list.
    if (currentStack.length === previousStack.length) {
      integrityCount = currentStack.length;
      break;
    }
    if (hasIntegrity(previousStack, currentStack, newIntegrityCount)) {
      integrityCount = newIntegrityCount;
      break;
    }
    previousStack = [...currentStack];
  }

  log('FINAL STACK', currentStack, 'totalCount', totalCount, 'integrityCount', integrityCount);

  return Promise.resolve({
    totalCount,
    integrityCount,
    page: pageToLoad,
    stack: currentStack,
    isGetError: false,
  } as SyncIntegrityCountSuccess<DataA, DataB>);
};
