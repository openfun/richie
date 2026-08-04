import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Enrollment, CredentialOrder, ProductType, OrderState } from 'types/Joanie';
import { Maybe, Nullable } from 'types/utils';
import { OrderHelper } from 'utils/OrderHelper';
import { isOrder, useOrdersEnrollments } from 'pages/DashboardCourses/useOrdersEnrollments';

/**
 * Orders canceled following the buyer's withdrawal must stay visible in the dashboard
 * (the learner needs to keep a trace of that legal action), unlike other cancellation
 * causes. The API can't filter on that distinction yet, so we only exclude REFUNDING/
 * REFUNDED server-side and drop the remaining non-withdrawn CANCELED orders here.
 */
const isHiddenCanceledOrder = (item: CredentialOrder | Enrollment) =>
  isOrder(item) && OrderHelper.isCanceled(item) && !OrderHelper.isWithdrawn(item);

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
      state_exclude: [OrderState.REFUNDING, OrderState.REFUNDED],
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
      const visibleData = (data as (CredentialOrder | Enrollment)[]).filter(
        (item) => !isHiddenCanceledOrder(item),
      );
      setOrderAndEnrollmentList(visibleData);
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
