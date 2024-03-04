import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageDescriptor, defineMessages, useIntl } from 'react-intl';
import { PaginatedResourceQuery, PaginatedResponse } from 'types/Joanie';
import { PER_PAGE } from 'settings';
import { useQueryKeyInvalidateListener } from 'hooks/useQueryKeyInvalidateListener';
import { Maybe } from 'types/utils';
import { syncIntegrityCount } from './utils/syncIntegrityCount';
import { FetchEntityData } from './utils/fetchEntities';
import { QueryConfig } from './utils/fetchEntity';
import { log } from './utils/log';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useUnionResource.errorGet',
    description: 'Error message shown to the user when union resources fetch request fails.',
    defaultMessage: 'An error occurred while fetching data. Please retry later.',
  },
});

interface UseUnionResourceReturns<DataA, DataB> {
  next: () => void;
  count: Maybe<number>;
  data: (DataA | DataB)[];
  isLoading: boolean;
  hasMore: boolean;
  error?: Maybe<string>;
}

export type FetchDataFunction<Data, FetchDataFilter> = (
  filters: FetchDataFilter,
) => Promise<PaginatedResponse<Data>>;

export interface ResourceUnionPaginationProps {
  perPage?: number;
}

interface UseUnionResourceProps<DataA, DataB, FiltersA, FiltersB>
  extends ResourceUnionPaginationProps {
  queryAConfig: QueryConfig<DataA, FiltersA>;
  queryBConfig: QueryConfig<DataB, FiltersB>;
  errorGetMessage?: MessageDescriptor;
  refetchOnInvalidation?: boolean;
}

/**
 * This hook is used to fetch two different paginated resources from the API.
 *
 * Good to know:
 * - The first time useUnionResource is called, it will fetch the first page of both resources automatically
 * - Then, subsequent calls to `next` will be needed to get the next slices of data.
 */
const useUnionResource = <
  DataA extends FetchEntityData,
  DataB extends FetchEntityData,
  FiltersA extends PaginatedResourceQuery = {},
  FiltersB extends PaginatedResourceQuery = {},
>({
  queryAConfig,
  queryBConfig,
  perPage = PER_PAGE.useUnionResources,
  errorGetMessage = messages.errorGet,
  refetchOnInvalidation = true,
}: UseUnionResourceProps<DataA, DataB, FiltersA, FiltersB>): UseUnionResourceReturns<
  DataA,
  DataB
> => {
  const [isSyncing, setIsSyncing] = useState(false);
  // stack of all fetched entities
  const [stack, setStack] = useState<(DataA | DataB)[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const [error, setError] = useState<Maybe<string>>();

  // cursor is the total amount of entities what we want to display.
  const [cursor, setCursor] = useState(perPage);

  // integrityCount is the number of fetched entities A and B that are correctly ordered.
  // we always fetch and sort a extra page, integrity count is the amount of entities up to
  // the last entity that didn't change index.
  const [integrityCount, setIntegrityCount] = useState(0);

  const intl = useIntl();

  // Eof keeps track of the last page of DataA and DataB we fetched.
  // Eof needs to be a ref as subsequent calls to fetchEntity needs to keep track of the latest
  // value of eof. Which would be impossible with setState.
  const queryClient = useQueryClient();
  const eofQueryKey = [...queryAConfig.queryKey, ...queryBConfig.queryKey, 'eof'];
  const eofRef = useRef<Record<string, number>>(queryClient.getQueryData(eofQueryKey) ?? {});
  log('eof', eofRef.current);

  const [update, setForceUpdate] = useState<number>();

  // to force execution of useEffect::fetchNewPage(),
  // reset need to generate a uniq key that is part of it's dependencies.
  const reset = () => {
    setStack([]);
    setPage(0);
    setTotalCount(undefined);
    setError(undefined);
    setCursor(perPage);
    setIntegrityCount(0);
    setForceUpdate(new Date().getTime());
  };

  // we manualy observe key invalidation to trigger new search
  // by generating a new update key
  if (refetchOnInvalidation) {
    useQueryKeyInvalidateListener(queryAConfig.queryKey, reset);
    useQueryKeyInvalidateListener(queryBConfig.queryKey, reset);
  }

  // filters have changes, new results will be fetch.
  // let's reset every previous fetches states
  // and re-generate update
  useEffect(() => {
    reset();
  }, [JSON.stringify(queryAConfig.filters), JSON.stringify(queryBConfig.filters)]);

  useEffect(() => {
    async function fetchNewPage() {
      const {
        totalCount: entitiesTotalCount,
        integrityCount: newIntegrityCount,
        page: newPage,
        stack: newStack,
        isGetError,
      } = await syncIntegrityCount<DataA, DataB, FiltersA, FiltersB>({
        stack,
        newIntegrityCount: cursor,
        integrityCount: 0,
        queryAConfig,
        queryBConfig,
        page,
        perPage,
        eofQueryKey,
        eofRef,
        queryClient,
      });

      if (isGetError) {
        setError(intl.formatMessage(errorGetMessage));
        setIsSyncing(false);
        return;
      }
      setPage(newPage);
      setIntegrityCount(newIntegrityCount);
      setStack(newStack);

      // Only the first newTotalCount is valid, because subsequent calls to fetchEntities may not be able to return
      // the correct value if we reached the end of the list.
      if (totalCount === undefined) {
        setTotalCount(entitiesTotalCount);
      }

      setIsSyncing(false);
    }

    // we request more entities than we can display in the right order
    // it's time for new fetching and sorting.
    if (!isSyncing && cursor > integrityCount) {
      setIsSyncing(true);
      fetchNewPage();
    }
  }, [
    cursor,
    // update assure that we refetch data on reset
    update,
  ]);

  const cursorToUse = Math.min(cursor, integrityCount);
  const next = () => {
    if (isSyncing) {
      return;
    }
    log('next', cursor + perPage);
    setCursor(cursor + perPage);
  };

  return {
    next,
    count: totalCount,
    data: stack.slice(0, cursorToUse),
    hasMore: totalCount ? cursorToUse < totalCount : false,
    error,
    isLoading: isSyncing,
  };
};
export default useUnionResource;
