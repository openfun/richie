import { PaginatedResourceQuery } from 'types/Joanie';
import { FetchEntityBaseArgs, fetchEntity, FetchDataFunction } from './fetchEntity';

export interface FetchEntityData {
  id: string;
  created_on: string;
}

interface FetchEntitiesArgs<DataA, DataB, FiltersA, FiltersB> extends FetchEntityBaseArgs {
  stack: (DataA | DataB)[];
  queryAConfig: QueryConfig<DataA, FiltersA>;
  queryBConfig: QueryConfig<DataB, FiltersB>;
}

export const fetchEntities = async <
  DataA extends FetchEntityData,
  DataB extends FetchEntityData,
  FiltersA extends PaginatedResourceQuery = PaginatedResourceQuery,
  FiltersB extends PaginatedResourceQuery = PaginatedResourceQuery,
>({
  stack,
  queryAConfig,
  queryBConfig,
  page,
  perPage,
  eofQueryKey,
  eofRef,
  queryClient,
}: FetchEntitiesArgs<DataA, DataB, FiltersA, FiltersB>) => {
  const newStack = [...stack];
  const { entities, count: totalCount } = await fetchEntitiesOfPage({
    queryAConfig,
    queryBConfig,
    page,
    perPage,
    eofQueryKey,
    eofRef,
    queryClient,
  });

  // Add only new entities to the stack.
  const entitiesStackIds: Record<string, boolean> = {};
  newStack.forEach((entity) => (entitiesStackIds[entity.id] = true));
  newStack.push(...entities.filter((entity) => !entitiesStackIds[entity.id]));
  // Sort according to created_on
  newStack.sort((a, b) => {
    const aDate = new Date(a.created_on);
    const bDate = new Date(b.created_on);
    return bDate.getTime() - aDate.getTime();
  });

  return { stack: newStack, totalCount };
};

interface QueryConfig<Data, Filters> {
  queryKey: string[];
  fn: FetchDataFunction<Data, Filters>;
  filters: Filters;
}
interface FetchEntitiesOfPageArgs<DataA, DataB, FiltersA, FiltersB> extends FetchEntityBaseArgs {
  queryAConfig: QueryConfig<DataA, FiltersA>;
  queryBConfig: QueryConfig<DataB, FiltersB>;
}

const fetchEntitiesOfPage = async <
  DataA,
  DataB,
  FiltersA extends PaginatedResourceQuery = PaginatedResourceQuery,
  FiltersB extends PaginatedResourceQuery = PaginatedResourceQuery,
>({
  queryAConfig,
  queryBConfig,
  page,
  perPage,
  eofQueryKey,
  eofRef,
  queryClient,
}: FetchEntitiesOfPageArgs<DataA, DataB, FiltersA, FiltersB>) => {
  let count = 0;
  let entities: (DataA | DataB)[] = [];

  const [dataAResponse, dataBResponse] = await Promise.all([
    fetchEntity({ queryConfig: queryAConfig, page, perPage, eofRef, eofQueryKey, queryClient }),
    fetchEntity({ queryConfig: queryBConfig, page, perPage, eofRef, eofQueryKey, queryClient }),
  ]);

  if (dataAResponse) {
    entities = [...dataAResponse.results];
    count += dataAResponse.count;
  }
  if (dataBResponse) {
    entities = [...entities, ...dataBResponse.results];
    count += dataBResponse.count;
  }

  return { entities, count };
};
