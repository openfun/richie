import type { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { MessageDescriptor } from 'react-intl';
import { HttpError } from 'utils/errors/HttpError';
import { ApiResourceInterface } from 'types/Joanie';
import { useResourcesOmniscient } from './useResourcesOmniscient';
import { useResourcesRoot } from './useResourcesRoot';

export interface ResourcesQuery {
  id?: string;
}

export interface Resource {
  id: string;
}

export type QueryOptions<TData extends Resource> = Omit<
  UseQueryOptions<unknown, HttpError, TData[]>,
  'queryKey' | 'queryFn'
>;

export interface UseResourcesProps<
  TData extends Resource,
  TResourceQuery extends ResourcesQuery = ResourcesQuery,
  TApiResource extends ApiResourceInterface<TData> = ApiResourceInterface<TData>,
> {
  queryKey: QueryKey;
  apiInterface: () => TApiResource;
  omniscient?: boolean;
  omniscientFiltering?: (data: TData[], filters: TResourceQuery) => TData[];
  session?: boolean;
  localized?: boolean;
  messages?: Record<string, MessageDescriptor>;
  frozenQueryKey?: boolean;
  onMutationSuccess?: (queryClient: QueryClient) => void;
}

export interface UseResourcesCallbackProps<
  TData extends Resource,
  TResourceQuery extends ResourcesQuery = ResourcesQuery,
  TApiResource extends ApiResourceInterface<TData> = ApiResourceInterface<TData>,
> extends UseResourcesProps<TData, TResourceQuery, TApiResource> {
  // TODO(rlecellier): we've cases where fitlers should be required.
  // like in useCourseOrder where the course_id filter must be set.
  filters?: TResourceQuery;
  queryOptions?: Omit<QueryOptions<TData>, 'queryFn' | 'queryKey'>;
}

export const useResourcesCustom = <
  TData extends Resource,
  TResourceQuery extends ResourcesQuery = ResourcesQuery,
  TApiResource extends ApiResourceInterface<TData> = ApiResourceInterface<TData>,
>(
  props: UseResourcesCallbackProps<TData, TResourceQuery, TApiResource>,
) => {
  if (props.omniscient) {
    return useResourcesOmniscient(props);
  }
  return useResourcesRoot(props);
};

export const useResources =
  <
    TData extends Resource,
    TResourceQuery extends ResourcesQuery = ResourcesQuery,
    TApiResource extends ApiResourceInterface<TData> = ApiResourceInterface<TData>,
  >(
    props: UseResourcesProps<TData, TResourceQuery, TApiResource>,
  ) =>
  (filters?: TResourceQuery, queryOptions?: QueryOptions<TData>) => {
    return useResourcesCustom({ ...props, filters, queryOptions });
  };

export const useResource =
  <TData extends Resource, TResourceQuery extends ResourcesQuery = ResourcesQuery>(
    props: UseResourcesProps<TData>,
  ) =>
  (id?: string, filters?: Omit<TResourceQuery, 'id'>, queryOptions?: QueryOptions<TData>) => {
    const resources = useResources<TData>(props);
    const res = resources({ id, ...filters }, { enabled: !!id, ...queryOptions });
    const { items, ...subRes } = res;
    return { ...subRes, item: items[0] };
  };
