import { Button } from 'components/Button';
import { DashboardItemEnrollmentFooter } from 'components/DashboardItem/DashboardItemEnrollmentFooter';
import { DashboardSubItem } from 'components/DashboardItem/DashboardSubItem';
import { Icon } from 'components/Icon';
import { FormattedMessage, useIntl } from 'react-intl';
import { Enrollment, Order, OrderState } from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';
import { DashboardSubItemsList } from './DashboardSubItemsList';
import { DashboardItem, DEMO_IMAGE_URL } from './index';

const messages = {
  accessCourse: {
    id: 'components.DashboardItemOrder.gotoCourse',
    description: '',
    defaultMessage: 'ACCESS COURSE',
  },
  statusOnGoing: {
    id: 'components.DashboardItemOrder.statusOnGoing',
    description:
      "Status shown on the dashboard order' item when order is validated with no certificate",
    defaultMessage: 'On going',
  },
  statusCompleted: {
    id: 'components.DashboardItemOrder.statusCompleted',
    description:
      "Status shown on the dashboard order' item when order is validated with certificate",
    defaultMessage: 'Completed',
  },
  statusOther: {
    id: 'components.DashboardItemOrder.statusOther',
    description: "Status shown on the dashboard order' item when order is not validated",
    defaultMessage: '{state}',
  },
};

interface DashboardItemOrderProps {
  order: Order;
}

export const DashboardItemOrder = ({ order }: DashboardItemOrderProps) => {
  const { course } = order;
  if (!course) {
    throw new Error('Order must provide course attribute');
  }
  const intl = useIntl();

  return (
    <DashboardItem
      title={course.title}
      code={'Ref. ' + course.code}
      imageUrl={DEMO_IMAGE_URL}
      footer={
        <>
          <div className="dashboard-item__block__status">
            <Icon name="icon-school" />
            <div>
              {order.state === OrderState.VALIDATED && !order.certificate && (
                <FormattedMessage {...messages.statusOnGoing} />
              )}
              {order.state === OrderState.VALIDATED && !!order.certificate && (
                <FormattedMessage {...messages.statusCompleted} />
              )}
              {order.state !== OrderState.VALIDATED && (
                <FormattedMessage
                  {...messages.statusOther}
                  values={{ state: StringHelper.capitalizeFirst(order.state) }}
                />
              )}
            </div>
          </div>
          <Button
            color="outline-primary"
            disabled={false}
            href={'/dashboard/courses/' + course.code}
            data-testid="dashboard-item-order__button"
          >
            {intl.formatMessage(messages.accessCourse)}
          </Button>
        </>
      }
    >
      <DashboardSubItemsList
        subItems={order.enrollments?.map((enrollment) => (
          <DashboardItemOrderEnrollment key={enrollment.id} enrollment={enrollment} />
        ))}
      />
    </DashboardItem>
  );
};

const DashboardItemOrderEnrollment = ({ enrollment }: { enrollment: Enrollment }) => {
  const { course } = enrollment.course_run;
  if (!course) {
    throw new Error('Enrollment must provide course attribute');
  }
  return (
    <DashboardSubItem
      title={course.title}
      footer={<DashboardItemEnrollmentFooter enrollment={enrollment} />}
    />
  );
};
