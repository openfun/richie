import { FormattedMessage, defineMessages } from 'react-intl';
import { CertificateType } from 'types/Joanie';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { useCertificates } from 'hooks/useCertificates';
import { PER_PAGE } from 'settings';
import Tabs from '../../components/Tabs';
import CertificatesList from './components/CertificateList';

const messages = defineMessages({
  orderCertificateTabLabel: {
    id: 'components.DashboardCertificates.orderCertificateTabLabel',
    description: 'The label of the order certificate tab',
    defaultMessage: 'Certificates',
  },
  enrollmentCertificateTabLabel: {
    id: 'components.DashboardCertificates.enrollmentCertificateTabLabel',
    description: 'The label of the enrollment certificate tab',
    defaultMessage: 'Attestations of achievement',
  },
});

interface DashboardCertificatesProps {
  certificateType: CertificateType;
}

export const DashboardCertificates = ({ certificateType }: DashboardCertificatesProps) => {
  const {
    items: enrollmentCertificates,
    states: { isFetched },
  } = useCertificates({
    type: CertificateType.ENROLLMENT,
    page: 1,
    page_size: PER_PAGE.certificateList,
  });

  return (
    <div className="dashboard-certificates">
      {isFetched && enrollmentCertificates.length > 0 && (
        <Tabs initialActiveTabName={certificateType}>
          <Tabs.Tab name={CertificateType.ORDER} href={LearnerDashboardPaths.ORDER_CERTIFICATES}>
            <FormattedMessage {...messages.orderCertificateTabLabel} />
          </Tabs.Tab>
          <Tabs.Tab
            name={CertificateType.ENROLLMENT}
            href={LearnerDashboardPaths.ENROLLMENT_CERTIFICATES}
          >
            <FormattedMessage {...messages.enrollmentCertificateTabLabel} />
          </Tabs.Tab>
        </Tabs>
      )}

      <div className="dashboard-certificates__content">
        <CertificatesList certificateType={certificateType} />
      </div>
    </div>
  );
};
