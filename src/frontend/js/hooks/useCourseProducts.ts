import { defineMessages } from 'react-intl';
import { API, CourseProductQueryFilters, CourseProductRelation } from 'types/Joanie';
import { QueryOptions, useResourcesCustom, UseResourcesProps } from 'hooks/useResources';
import { useJoanieApi } from 'contexts/JoanieApiContext';

export const messages = defineMessages({
  errorGet: {
    id: 'hooks.useCourseProducts.errorGet',
    description: 'Error message shown to the user when product fetch request fails.',
    defaultMessage: 'An error occurred while fetching product. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useCourseProducts.errorNotFound',
    description: 'Error message shown to the user when no product matches.',
    defaultMessage: 'Cannot find the product.',
  },
});

/**
 * Joanie Api hook to retrieve a product through its id and a course code.
 */
const props: UseResourcesProps<
  CourseProductRelation,
  CourseProductQueryFilters,
  API['courses']['products']
> = {
  queryKey: ['courses-products'],
  apiInterface: () => useJoanieApi().courses.products,
  messages,
};

export const useCourseProduct = (
  id: CourseProductQueryFilters['id'],
  filters: Omit<CourseProductQueryFilters, 'id'>,
  queryOptions?: QueryOptions<CourseProductRelation>,
) => {
  const enabled = !!id && !!filters.productId;
  const resources = useResourcesCustom<CourseProductRelation, CourseProductQueryFilters>({
    ...props,
    filters: { id, ...filters },
    queryOptions: { ...queryOptions, enabled },
  });
  const { items, ...subRes } = resources;
  return { ...subRes, item: items[0] };
};
