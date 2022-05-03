import { Children } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import CourseProductItem from 'components/CourseProductItem';
import { Spinner } from 'components/Spinner';
import { CourseCodeProvider } from 'data/CourseCodeProvider';
import { useCourse } from 'hooks/useCourse';
import type * as Joanie from 'types/Joanie';

export const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading course information...',
    description:
      'Accessible text for the initial loading spinner displayed when course is fetching',
    id: 'components.CourseProductsList.loadingInitial',
  },
});

interface Props {
  code: Joanie.Course['code'];
}

const CourseProductsList = ({ code }: Props) => {
  const course = useCourse(code);

  const getProductOrder = (productId: Joanie.Course['products'][0]['id']) => {
    return course.item?.orders?.find((order) => order.product === productId);
  };

  // - useCourse hook is fetching data
  if (course.states.fetching) {
    return (
      <Spinner aria-labelledby="loading-course">
        <span id="loading-course">
          <FormattedMessage {...messages.loading} />
        </span>
      </Spinner>
    );
  }

  // - There is no related course from Joanie or no related products.
  if (!course.item || course.item?.products?.length === 0) return null;

  return (
    <CourseCodeProvider code={code}>
      {Children.toArray(
        course.item!.products.map((product) => (
          <CourseProductItem product={product} order={getProductOrder(product.id)} />
        )),
      )}
    </CourseCodeProvider>
  );
};

export default CourseProductsList;
