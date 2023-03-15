import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from 'components/Button';
import { Icon } from 'components/Icon';
import { Certificate, Course } from 'types/Joanie';
import { useDownloadCertificate } from 'hooks/useDownloadCertificate';
import { Spinner } from 'components/Spinner';
import useDateFormat from 'hooks/useDateFormat';
import { DashboardItem } from 'widgets/Dashboard/components/DashboardItem/index';

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
  generatingCertificate: {
    defaultMessage: 'Certificate is being generated...',
    description:
      'Accessible label displayed while certificate is being generated on the dashboard.',
    id: 'components.DashboardCertificate.generatingCertificate',
  },
});

export const DashboardItemCertificate = ({ certificate }: { certificate: Certificate }) => {
  const course = certificate.order.course as Course;
  const { download, loading } = useDownloadCertificate();
  const formatDate = useDateFormat();

  const onDownloadClick = async () => {
    await download(certificate.id);
  };

  return (
    <DashboardItem
      title={course.title}
      code={'Ref. ' + course.code}
      imageUrl="https://d29emq8to944i.cloudfront.net/cba69447-b9f7-b4d7-c0d5-4d98b5280a4e/thumbnails/1659356729_1080.jpg"
      footer={
        <>
          <div className="dashboard-certificate__body">
            <Icon name="icon-certificate" />
            <span>{certificate.certificate_definition.title}</span>
          </div>
          <div className="dashboard-certificate__footer">
            <span>
              <FormattedMessage
                {...messages.issuedOn}
                values={{ date: formatDate(certificate.issued_on) }}
              />
            </span>
            <div>
              <Button color="outline-primary" disabled={loading} onClick={onDownloadClick}>
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
            </div>
          </div>
        </>
      }
    />
  );
};
