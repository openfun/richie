import { FormattedMessage, defineMessages } from 'react-intl';
import { CertificateType } from 'types/Joanie';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
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
  return (
    <div className="dashboard-certificates">
      <Tabs
        initialActiveTabName={
          certificateType === CertificateType.ORDER
            ? 'order-certificate-tab'
            : 'enrollment-certificate-tab'
        }
      >
        <Tabs.Tab name="order-certificate-tab" href={LearnerDashboardPaths.ORDER_CERTIFICATES}>
          <FormattedMessage {...messages.orderCertificateTabLabel} />
        </Tabs.Tab>
        <Tabs.Tab
          name="enrollment-certificate-tab"
          href={LearnerDashboardPaths.ENROLLMENT_CERTIFICATES}
        >
          <FormattedMessage {...messages.enrollmentCertificateTabLabel} />
        </Tabs.Tab>
      </Tabs>
      <div className="dashboard-certificates__content">
        <CertificatesList certificateType={certificateType} />
      </div>
    </div>
  );
};
