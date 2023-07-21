import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Certificate, CertificateDefinition, CourseLight } from 'types/Joanie';
import { useDownloadCertificate } from 'hooks/useDownloadCertificate';
import { Spinner } from 'components/Spinner';
import useDateFormat from 'hooks/useDateFormat';
import { DashboardItem } from 'widgets/Dashboard/components/DashboardItem/index';
import { Maybe } from 'types/utils';

const messages = defineMessages({
  download: {
    defaultMessage: 'Download',
    description: 'Label for the download button of a certificate',
    id: 'components.DashboardCertificate.download',
  },
  details: {
    defaultMessage: 'Details',
    description: 'Label for the details button of a certificate',
    id: 'components.DashboardCertificate.details',
  },
  issuedOn: {
    defaultMessage: 'Issued on {date}',
    description: 'Label for the date of issue of a certificate',
    id: 'components.DashboardCertificate.issuedOn',
  },
  noCertificate: {
    defaultMessage:
      'When all your courses will be passed, you will be able to download your certificate here.',
    description: 'Label displayed when no certificate is available',
    id: 'components.DashboardCertificate.noCertificate',
  },
  generatingCertificate: {
    defaultMessage: 'Certificate is being generated...',
    description:
      'Accessible label displayed while certificate is being generated on the dashboard.',
    id: 'components.DashboardCertificate.generatingCertificate',
  },
});

export const DashboardItemCertificate = ({
  certificate,
  certificateDefinition,
}: {
  certificate?: Certificate;
  certificateDefinition?: CertificateDefinition;
}) => {
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

  const course = certificate?.order.course as Maybe<CourseLight>;
  const { download, loading } = useDownloadCertificate();
  const formatDate = useDateFormat();

  const onDownloadClick = async () => {
    if (!certificate) {
      return;
    }
    await download(certificate.id);
  };

  return (
    <DashboardItem
      title={course?.title ?? ''}
      code={'Ref. ' + (course?.code ?? '')}
      imageUrl="https://d29emq8to944i.cloudfront.net/cba69447-b9f7-b4d7-c0d5-4d98b5280a4e/thumbnails/1659356729_1080.jpg"
      footer={
        <>
          <div className="dashboard-certificate__body">
            <Icon name={IconTypeEnum.CERTIFICATE} />
            <span>{certificateDefinition!.title}</span>
          </div>
          <div className="dashboard-certificate__footer">
            <span>
              {certificate ? (
                <FormattedMessage
                  {...messages.issuedOn}
                  values={{ date: formatDate(certificate!.issued_on) }}
                />
              ) : (
                <FormattedMessage {...messages.noCertificate} />
              )}
            </span>
            <div>
              {certificate && (
                <Button color="secondary" disabled={loading} onClick={onDownloadClick}>
                  {loading ? (
                    <Spinner theme="primary" aria-labelledby="generating-certificate">
                      <span id="generating-certificate">
                        <FormattedMessage {...messages.generatingCertificate} />
                      </span>
                    </Spinner>
                  ) : (
                    <FormattedMessage {...messages.download} />
                  )}
                </Button>
              )}
            </div>
          </div>
        </>
      }
    />
  );
};
