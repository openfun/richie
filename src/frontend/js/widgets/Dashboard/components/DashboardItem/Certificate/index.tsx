import { useMemo } from 'react';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Certificate, CertificateDefinition, CourseLight, ProductType } from 'types/Joanie';
import {
  DashboardItem,
  DashboardItemProps,
} from 'widgets/Dashboard/components/DashboardItem/index';
import { Maybe } from 'types/utils';
import DownloadCertificateButton from 'components/DownloadCertificateButton';
import { CertificateHelper } from 'utils/CertificateHelper';
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
  const getCertificateDefinition = () => {
    if (certificate && certificateDefinition) {
      throw new Error('certificate and certificateDefinition are mutually exclusive');
    } else if (!certificate && !certificateDefinition) {
      throw new Error('certificate or certificateDefinition is required');
    }

    return certificate ? certificate.certificate_definition : certificateDefinition;
  };

  const course: Maybe<CourseLight> = useMemo(
    () => CertificateHelper.getCourse(certificate),
    [certificate],
  );
  const definition = useMemo(getCertificateDefinition, [certificate]);

  return (
    <DashboardItem
      mode={mode}
      title={course?.title ?? ''}
      code={'Ref. ' + (course?.code ?? '')}
      imageFile={course?.cover}
      footer={
        <>
          <div className="dashboard-certificate__body">
            <Icon name={IconTypeEnum.CERTIFICATE} />
            <span>{definition!.title}</span>
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
