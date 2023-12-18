import { Icon, IconTypeEnum } from 'components/Icon';
import { Certificate, CertificateDefinition, CourseLight, ProductType } from 'types/Joanie';
import {
  DashboardItem,
  DashboardItemProps,
} from 'widgets/Dashboard/components/DashboardItem/index';
import { Maybe } from 'types/utils';
import DownloadCertificateButton from 'components/DownloadCertificateButton';
import CertificateStatus from '../CertificateStatus';

interface DashboardItemCertificateProps {
  certificate?: Certificate;
  certificateDefinition?: CertificateDefinition;
  productType?: ProductType;
  mode?: DashboardItemProps['mode'];
}
export const DashboardItemCertificate = ({
  certificate,
  certificateDefinition,
  productType,
  mode,
}: DashboardItemCertificateProps) => {
  if (certificate) {
    if (certificateDefinition) {
      throw new Error('certificate and certificateDefinition are mutually exclusive');
    }
    certificateDefinition = certificate.certificate_definition;
  } else if (certificateDefinition) {
    if (certificate) {
      throw new Error('certificate and certificateDefinition are mutually exclusive');
    }
  } else {
    throw new Error('certificate or certificateDefinition is required');
  }

  let course: Maybe<CourseLight>;
  if (certificate) {
    if (certificate.order?.course) {
      course = certificate.order.course;
    } else {
      course = certificate.order.enrollment.course_run.course;
    }
  }

  return (
    <DashboardItem
      mode={mode}
      title={course?.title ?? ''}
      code={'Ref. ' + (course?.code ?? '')}
      imageUrl="https://d29emq8to944i.cloudfront.net/cba69447-b9f7-b4d7-c0d5-4d98b5280a4e/thumbnails/1659356729_1080.jpg"
      imageFile={course?.cover}
      footer={
        <>
          <div className="dashboard-certificate__body">
            <Icon name={IconTypeEnum.CERTIFICATE} />
            <span>{certificateDefinition!.title}</span>
          </div>
          <div className="dashboard-certificate__footer">
            <span>
              <CertificateStatus certificate={certificate} productType={productType} />
            </span>
            <div>{certificate && <DownloadCertificateButton certificateId={certificate.id} />}</div>
          </div>
        </>
      }
    />
  );
};
