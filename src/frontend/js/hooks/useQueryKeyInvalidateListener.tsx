import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import usePrevious from 'hooks/usePrevious';

export const useQueryKeyInvalidateListener = (queryKey: string[], callback: Function) => {
  const { data: refreshFlag } = useQuery({
    queryKey: [...queryKey, 'refresh-flag'],
    queryFn: () => Math.random(),
  });
  const previousRefreshFlag = usePrevious(refreshFlag);
  useEffect(() => {
    if (previousRefreshFlag) {
      callback();
    }
  }, [refreshFlag]);
};
