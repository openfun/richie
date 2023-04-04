import { useEffect, useRef, useState } from 'react';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { defineMessages, useIntl } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { Resource } from 'hooks/useResources';
import {
  Enrollment,
  EnrollmentsQuery,
  Order,
  PaginatedResourceQuery,
  PaginatedResponse,
} from 'types/Joanie';
import { Maybe } from 'types/utils';
import { OrderResourcesQuery } from 'hooks/useOrders';
import { REACT_QUERY_SETTINGS } from 'settings';

export enum DataType {
  ENROLLMENT = 'enrollment',
  ORDER = 'order',
}

export type Data = {
  type: DataType;
  item: Enrollment | Order;
};

const PAGE_SIZE = 50;

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useOrdersEnrollments.errorGet',
    description: 'Error message shown to the user when orders or enrollments fetch request fails.',
    defaultMessage: 'An error occurred while fetching orders and enrollments. Please retry later.',
  },
});

const hasIntegrity = (previousStack: Data[], newStack: Data[], integrityCount: number) => {
  if (previousStack.length < integrityCount || newStack.length < integrityCount) {
    return false;
  }

  // If we find a difference, we return false.
  return !newStack.slice(0, integrityCount).find((item, index) => {
    return previousStack[index].item.id !== item.item.id;
  });
};

const EOF_QUERY_KEY = ['user', 'orders-enrollments', 'eof'];

const DEBUG = false;
const log = (...args: any) => {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

const useUtils = () => {
  const queryClient = useQueryClient();
  const api = useJoanieApi();

  // Eof keeps track of the last page of orders and enrollments we fetched.
  // Eof needs to be a ref as subsequent calls to fetchEntity needs to keep track of the latest
  // value of eof. Which would be impossible with setState.
  const eof = useRef<Record<string, number>>(queryClient.getQueryData(EOF_QUERY_KEY) ?? {});
  log('eof', eof.current);

  const fetchEntity = async <ResponseData extends Resource, Filters extends PaginatedResourceQuery>(
    queryKey: QueryKey,
    fn: (filters?: PaginatedResourceQuery) => Promise<PaginatedResponse<ResponseData>>,
    filters: Filters,
  ): Promise<Maybe<PaginatedResponse<ResponseData>>> => {
    const queryKeyString = queryKey.join('-');
    // Do not fetch if we already reached the end of the list.
    if (
      typeof eof.current[queryKeyString] === 'number' &&
      filters.page! > eof.current[queryKeyString]
    ) {
      return;
    }
    const QUERY_KEY = ['user', ...queryKey, JSON.stringify(filters)];
    const state = queryClient.getQueryState<PaginatedResponse<ResponseData>>(QUERY_KEY);
    let data: Maybe<PaginatedResponse<ResponseData>>;
    // Here we need to mimic the behavior of staleTime, which does not seems to be implemented when using `getQueryData`.
    if (
      state &&
      state.dataUpdatedAt >= new Date().getTime() - REACT_QUERY_SETTINGS.staleTimes.sessionItems
    ) {
      data = state.data;
    }

    if (data) {
      return data;
    }
    const res = await fn(filters);
    queryClient.setQueryData(QUERY_KEY, res);

    // If we reached the end of the list, we set the eof flag to prevent future requests.
    if (!res.next) {
      eof.current = { ...eof.current, [queryKeyString]: filters.page! };
      // Eof is cached based, the same way, we cache the fetching data. Otherwise it there would
      // be request to non existing pages after reload.
      queryClient.setQueryData(EOF_QUERY_KEY, eof.current);
    }
    return res;
  };

  const fetchEntitiesOfPage = async (pageToLoad: number) => {
    let totalCount = 0;
    let entities: Data[] = [];
    const filters = {
      page: pageToLoad,
      page_size: PAGE_SIZE,
    };

    const [ordersResponse, enrollmentsResponse] = await Promise.all([
      fetchEntity<Order, OrderResourcesQuery>(['orders'], api.user.orders.get, filters),
      fetchEntity<Enrollment, EnrollmentsQuery>(['enrollments'], api.user.enrollments.get, {
        ...filters,
        was_created_by_order: false,
      }),
    ]);

    if (ordersResponse) {
      entities = [
        ...ordersResponse.results.map((order) => ({ type: DataType.ORDER, item: order })),
      ];
      totalCount += ordersResponse.count;
    }
    if (enrollmentsResponse) {
      entities = [
        ...entities,
        ...enrollmentsResponse.results.map((enrollment) => ({
          type: DataType.ENROLLMENT,
          item: enrollment,
        })),
      ];
      totalCount += enrollmentsResponse.count;
    }

    return { entities, totalCount };
  };

  const fetchEntities = async (pageToLoad: number, entitiesStack: Data[]) => {
    const newEntitiesStack = [...entitiesStack];
    const { entities, totalCount } = await fetchEntitiesOfPage(pageToLoad);
    // Add missing ones.
    const entitiesStackIds: Record<string, boolean> = {};
    newEntitiesStack.forEach((entity) => (entitiesStackIds[entity.item.id] = true));
    newEntitiesStack.push(...entities.filter((entity) => !entitiesStackIds[entity.item.id]));

    // Sort according to created_on
    newEntitiesStack.sort((a, b) => {
      const aDate = new Date(a.item.created_on);
      const bDate = new Date(b.item.created_on);
      return bDate.getTime() - aDate.getTime();
    });

    return { stack: newEntitiesStack, totalCount };
  };

  return { fetchEntities };
};

/**
 * This hook is used to fetch orders and enrollments from the API.
 *
 * The goals are:
 * - We want a stack of all fetched items
 * - We want to guarantee that the [0, integrityCount] slice of has integrity
 * ( By integrity, we mean that no matters futures fetches, the slice will always be the same )
 * - We want to provide ( via data ) the slice [0, cursor] of the stack with integrity
 *
 * The algorithm of integrity building is:
 * - Fetch page P of orders and enrollments, merge them, and sort them. We call it `previousStack`
 * - Fetch page P+1 of orders and enrollments, merge them, and sort them. We call it `currentStack`
 * - If `previousStack` and `currentStack` are equal on [0, wantedIntegrityCount],
 *    we can say that the integrity is verified over [0, wantedIntegrityCount], because it means this
 *    portion will never change over futures fetches ( due to consistent sorting ).
 * - If not, then loop over the next pages until we find the integrity.
 * - Then provide the slice [0, cursor] of the stack with integrity via data.
 * - NB: If previousStack and currentStack have the same length, it means that we fetched all
 *    entities, so we can say that the integrity is verified over [0, totalCount] by definition.
 *
 * Good to know:
 * - The first time useOrdersEnrollments is called, it will fetch the first page of orders and
 *    enrollments automatically.
 * - Then, subsequent calls to `next` will be needed to get the next slices of data.
 */
export const useOrdersEnrollments = () => {
  const { fetchEntities } = useUtils();
  const [error, setError] = useState<Maybe<string>>();
  const [cursor, setCursor] = useState(PAGE_SIZE);
  const [integrityCount, setIntegrityCount] = useState(0);
  const [stack, setStack] = useState<Data[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const [isSyncing, setIsSyncing] = useState(false);
  const intl = useIntl();

  const syncIntegrityCount = async (wantedIntegrityCount: number) => {
    if (integrityCount === wantedIntegrityCount) {
      return;
    }
    setIsSyncing(true);
    log('We want integrity', wantedIntegrityCount, 'page', page);

    let pageToLoad = page;
    let previousStack = [...stack];
    let currentStack: Data[];
    let newTotalCount;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      pageToLoad += 1;
      currentStack = [...previousStack];
      log('Fetching page ' + pageToLoad + ' ...');

      let tmpTotalCount: number;
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetchEntities(pageToLoad, currentStack);
        tmpTotalCount = res.totalCount;
        currentStack = res.stack;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(intl.formatMessage(messages.errorGet));
        break;
      }

      // Only the first newTotalCount is valid, because subsequent calls to fetchEntities may not be able to return
      // the correct value if we reached the end of the list.
      if (newTotalCount === undefined) {
        newTotalCount = tmpTotalCount;
      }
      log(
        'hasIntegrity',
        'previous',
        previousStack.length,
        'current',
        currentStack.length,
        'newTotalCount',
        newTotalCount,
      );

      // Having the same length means that we reached the end of the list.
      if (currentStack.length === previousStack.length) {
        setIntegrityCount(currentStack.length);
        break;
      }
      if (hasIntegrity(previousStack, currentStack, wantedIntegrityCount)) {
        setIntegrityCount(wantedIntegrityCount);
        break;
      }
      previousStack = currentStack;
    }

    log('FINAL STACK', currentStack, 'totalCount', totalCount, 'newTotalCount', newTotalCount);

    if (totalCount === undefined) {
      setTotalCount(newTotalCount);
    }
    setPage(pageToLoad);
    setStack(currentStack);
    setIsSyncing(false);
  };

  useEffect(() => {
    if (cursor > integrityCount) {
      syncIntegrityCount(cursor);
    }
  }, [cursor]);

  const cursorToUse = Math.min(cursor, integrityCount);
  log(
    'page',
    page,
    'cursorToUse',
    cursorToUse,
    'cursor',
    cursor,
    'integrityCount',
    integrityCount,
    'totalCount',
    totalCount,
  );
  return {
    next: () => {
      if (isSyncing) {
        console.warn('Cannot next while syncing.');
        return;
      }
      log('next', cursor + PAGE_SIZE);
      setCursor(cursor + PAGE_SIZE);
    },
    count: totalCount,
    data: stack.slice(0, cursorToUse),
    hasMore: !(typeof totalCount !== 'undefined' && cursorToUse >= totalCount),
    error,
    isLoading: isSyncing,
  };
};
