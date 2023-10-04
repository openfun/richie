import { type PropsWithChildren, useMemo, createContext, useContext } from 'react';
import type { Maybe } from 'types/utils';
import type * as Joanie from 'types/Joanie';

const Context = createContext<
  Maybe<{
    enrollmentId?: Joanie.Enrollment['id'];
    courseCode?: Joanie.CourseLight['code'];
    productId: Joanie.Product['id'];
    key: string;
  }>
>(undefined);

export interface ProductCredentialRelationProviderProps {
  courseCode: Joanie.CourseLight['code'];
  productId: Joanie.Product['id'];
  enrollmentId?: undefined;
}
interface ProductCertificateRelationProviderProps {
  enrollmentId: Joanie.Enrollment['id'];
  productId: Joanie.Product['id'];
  courseCode?: undefined;
}
export type ProductRelationProviderProps =
  | ProductCredentialRelationProviderProps
  | ProductCertificateRelationProviderProps;

/**
 * A React Provider which aims to wrap components related to a specific course. In this
 * way we are able to pass down course's code to children.
 */
export const ProductRelationProvider = ({
  courseCode,
  productId,
  enrollmentId,
  children,
}: PropsWithChildren<ProductRelationProviderProps>) => {
  const value = useMemo(
    () => ({
      productId,
      courseCode,
      enrollmentId,
      key: enrollmentId ? `${enrollmentId}_${productId}` : `${courseCode}_${productId}`,
    }),
    [productId, courseCode, enrollmentId],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

/**
 * A hook to use within `ProductRelationProvider`. It returns the course code and product id context.
 */
export const useCourseProduct = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error(
      'useCourseProduct must be used within a component wrapped by a <ProductRelationProvider />.',
    );
  }
  return context;
};
