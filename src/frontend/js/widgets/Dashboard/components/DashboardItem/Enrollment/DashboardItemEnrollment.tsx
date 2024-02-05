import { useMemo } from 'react';
import { Enrollment, isCertificateProduct } from 'types/Joanie';
import { Enrolled } from '../CourseEnrolling';
import { DashboardItem } from '..';
import ProductCertificateFooter from './ProductCertificateFooter';

interface DashboardItemCourseRunProps {
  enrollment: Enrollment;
}

export const DashboardItemEnrollment = ({ enrollment }: DashboardItemCourseRunProps) => {
  const { course } = enrollment.course_run;
  if (!course) {
    throw new Error("Enrollment's course_run must provide course attribute");
  }
  const footerList = useMemo(() => {
    const partialFooterList = [
      <div
        key={`${enrollment.id}_enrolled_footer`}
        data-testid={'dashboard-item__course-enrolling__' + course.code}
      >
        <div className="dashboard-item__course-enrolling__infos">
          <Enrolled icon={true} enrollment={enrollment} />
        </div>
      </div>,
    ];
    enrollment.product_relations.forEach(({ product }) => {
      if (isCertificateProduct(product)) {
        partialFooterList.push(
          <ProductCertificateFooter
            key={[enrollment.id, product.id].join('_')}
            product={product}
            enrollment={enrollment}
          />,
        );
      }
    });
    return partialFooterList;
  }, [enrollment, course]);

  return <DashboardItem title={course.title} code={'Ref. ' + course.code} footer={footerList} />;
};
