import { useIntl } from 'react-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiResourceInterface } from 'types/Joanie';
import { messages, useResourcesRoot } from './useResourcesRoot';
import { Resource, ResourcesQuery, UseResourcesProps } from './index';

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
}: UseResourcesProps<TData, TResourceQuery, TApiResource>) => {
  const intl = useIntl();
  const useResources = useResourcesRoot({ ...props, frozenQueryKey: true });
  const [data, setData] = useState<TData[]>([]);
  const actualMessages = useMemo(
    () => ({ ...messages, ...props.messages }),
    [messages, props.messages],
  );
  const filter = useCallback(() => {
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
  }, [useResources.items, JSON.stringify(filters)]);

  return { ...useResources, items: data };
};
