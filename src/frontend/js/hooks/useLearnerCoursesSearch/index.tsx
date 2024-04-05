import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Enrollment, CredentialOrder, OrderState, ProductType } from 'types/Joanie';
import { Maybe, Nullable } from 'types/utils';
import { useOrdersEnrollments } from 'pages/DashboardCourses/useOrdersEnrollments';

const useLearnerCoursesSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [count, setCount] = useState<Maybe<number>>();
  const [orderAndEnrollmentList, setOrderAndEnrollmentList] = useState<
    (CredentialOrder | Enrollment)[]
  >([]);
  const [isNewSearchLoading, setIsNewSearchLoading] = useState(false);
  const query = searchParams.get('query') || undefined;
  const {
    data,
    isLoading,
    next,
    hasMore,
    count: currentCount,
    error,
  } = useOrdersEnrollments({
    query,
    orderFilters: {
      product_type: [ProductType.CREDENTIAL],
      state_exclude: [OrderState.CANCELED],
    },
  });

  useEffect(() => {
    if (!data.length && isLoading) {
      setIsNewSearchLoading(true);
    }

    if (isLoading) {
      return;
    }

    if (isNewSearchLoading) {
      setIsNewSearchLoading(false);
    }

    if (isNewSearchLoading || data.length > orderAndEnrollmentList?.length) {
      setOrderAndEnrollmentList(data as (CredentialOrder | Enrollment)[]);
      setCount(currentCount);
    }
  }, [data.length, isLoading, isNewSearchLoading, query]);

  const submitSearch = (newQuery: Nullable<string>) => {
    if (newQuery === null) {
      searchParams.delete('query');
    } else {
      searchParams.set('query', newQuery);
    }

    setSearchParams(searchParams);
    if (!newQuery) {
      setCount(undefined);
    }
  };

  return {
    submitSearch,
    data: orderAndEnrollmentList,
    isNewSearchLoading,
    isLoadingMore: isLoading && !isNewSearchLoading,
    next,
    hasMore,
    count,
    error,
  };
};
export default useLearnerCoursesSearch;
