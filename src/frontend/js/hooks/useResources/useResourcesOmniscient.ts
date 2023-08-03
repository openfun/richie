import { useIntl } from 'react-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiResourceInterface } from 'types/Joanie';
import { messages, useResourcesRoot } from './useResourcesRoot';
import { Resource, ResourcesQuery, UseResourcesCallbackProps } from './index';

/**
 * This hook internally wraps `useResourcesRoot` but will bulk-fetch all the whole set of resources
 * internally, and then do a in-memory filtering on the client side.
 *
 * So that means changing filters will not trigger a new request to the API.
 *
 * @param filters
 * @param props
 */
export const useResourcesOmniscient = <
  TData extends Resource,
  TResourceQuery extends ResourcesQuery = ResourcesQuery,
  TApiResource extends ApiResourceInterface<TData> = ApiResourceInterface<TData>,
>({
  filters,
  ...props
}: UseResourcesCallbackProps<TData, TResourceQuery, TApiResource>) => {
  const intl = useIntl();
  const useResources = useResourcesRoot({ ...props, frozenQueryKey: true });
  const [data, setData] = useState<TData[]>([]);
  const actualMessages = useMemo(
    () => ({ ...messages, ...props.messages }),
    [messages, props.messages],
  );
  const filter = useCallback(() => {
    // The following condition is important, let's illustrate it with the following situation:
    // - enabled: false ( happens when waiting for filters values, like `id` for useResource )
    // - react-query already has items in cache because they are already loaded from somewhere in the
    //  app ( the QUERY_KEY stays the same with omniscient resources )
    // => The current function ( useResourcesOmniscient ) would return all cached items without this
    //  condition, where in reality we must return nothing because filters are not defined yet.
    if (props.queryOptions?.enabled === false) {
      setData([]);
      return;
    }

    if (!useResources.items) {
      setData([]);
      return;
    }

    const filterKeys = typeof filters === 'object' ? Object.keys(filters).length : 0;
    if (filterKeys === 0) {
      // Do not apply filtering.
      setData(useResources.items);
      return;
    }

    // Apply filtering.
    let tmpData = useResources.items;
    if (filters?.id) {
      tmpData = tmpData.filter((a) => a.id === filters!.id);
    }
    if (props.omniscientFiltering) {
      tmpData = props.omniscientFiltering(tmpData, filters!);
    }
    if (tmpData.length === 0) {
      useResources.methods.setError(intl.formatMessage(actualMessages.errorNotFound));
      setData([]);
      return;
    }
    setData(tmpData);
  }, [useResources.items, JSON.stringify(filters), actualMessages]);

  useEffect(() => {
    if (useResources.states.fetching) {
      return;
    }
    filter();
  }, [useResources.states.fetching, useResources.items, JSON.stringify(filters)]);

  return { ...useResources, items: data };
};
