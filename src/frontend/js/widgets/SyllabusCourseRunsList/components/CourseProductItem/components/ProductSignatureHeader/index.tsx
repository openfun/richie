import { Button } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import Banner, { BannerType } from 'components/Banner';
import { getDashboardBasename } from 'widgets/Dashboard/hooks/useDashboardRouter/getDashboardBasename';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { Order } from 'types/Joanie';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';

const messages = defineMessages({
  signatureNeeded: {
    defaultMessage: 'You need to sign your training contract before enrolling to course runs',
    description: 'Banner displayed when the contract is not signed on the syllabus',
    id: 'components.CourseProductItem.signatureNeeded',
  },
  contractSignActionLabel: {
    id: 'components.CourseProductItem.contractSignActionLabel',
    description: 'Label of "sign contract" action on the syllabus.',
    defaultMessage: 'Sign your training contract',
  },
});

export const ProductSignatureHeader = ({ order }: { order?: Order }) => {
  const intl = useIntl();
  return (
    <>
      <Banner message={intl.formatMessage(messages.signatureNeeded)} type={BannerType.ERROR} />
      <Button
        fullWidth={true}
        className="mb-s"
        size="small"
        href={
          getDashboardBasename(intl.locale) +
          getDashboardRoutePath(intl)(LearnerDashboardPaths.ORDER, { orderId: order!.id })
        }
      >
        <FormattedMessage {...messages.contractSignActionLabel} />
      </Button>
    </>
  );
};
