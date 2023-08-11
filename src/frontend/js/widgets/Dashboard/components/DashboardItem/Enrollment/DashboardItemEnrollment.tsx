import { useMemo } from 'react';
import { Enrollment, ProductType } from 'types/Joanie';
import { DashboardItemCourseEnrolling } from '../DashboardItemCourseEnrolling';
import { DashboardItem } from '..';
import ProductCertificateFooter from './ProductCertificateFooter';

interface DashboardItemCourseRunProps {
  enrollment: Enrollment;
}

export const DashboardItemEnrollment = ({ enrollment }: DashboardItemCourseRunProps) => {
  const { course, state: courseRunState } = enrollment.course_run;
  if (!course) {
    throw new Error("Enrollment's course_run must provide course attribute");
  }

  const footerList = useMemo(() => {
    const partialFooterList = [
      <DashboardItemCourseEnrolling
        key={`${enrollment.id}`}
        course={course}
        activeEnrollment={enrollment}
        icon={true}
      />,
    ];
    enrollment.products.forEach((product) => {
      if (product.type === ProductType.CERTIFICATE) {
        partialFooterList.push(
          <ProductCertificateFooter
            key={[enrollment.id, product.id].join('_')}
            product={product}
            course={course}
            courseRunState={courseRunState}
          />,
        );
      }
    });
    return partialFooterList;
  }, [enrollment, course]);

  return <DashboardItem title={course.title} code={'Ref. ' + course.code} footer={footerList} />;
};
