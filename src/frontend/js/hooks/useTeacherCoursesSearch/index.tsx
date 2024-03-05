import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCourseProductUnion } from 'hooks/useCourseProductUnion';
import { CourseListItem, CourseProductRelation, ProductType } from 'types/Joanie';
import { Maybe, Nullable } from 'types/utils';

const useTeacherCoursesSearch = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [count, setCount] = useState<Maybe<number>>(0);
  const [courseAndProductList, setCourseAndProductList] = useState<
    (CourseListItem | CourseProductRelation)[]
  >([]);
  const [isNewSearchLoading, setIsNewSearchLoading] = useState(false);
  const query = searchParams.get('query') || undefined;
  const {
    data,
    isLoading,
    next,
    hasMore,
    count: currentCount,
  } = useCourseProductUnion({
    query,
    organizationId,
    perPage: 25,
    productType: ProductType.CREDENTIAL,
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

    if (isNewSearchLoading || data.length > courseAndProductList?.length) {
      setCourseAndProductList(data);

      // research counter should not be displayed when query is empty
      if (query) {
        setCount(currentCount);
      }
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
    data: courseAndProductList,
    isNewSearchLoading,
    isLoadingMore: isLoading && !isNewSearchLoading,
    next,
    hasMore,
    count,
  };
};
export default useTeacherCoursesSearch;
