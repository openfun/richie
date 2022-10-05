import { FormattedMessage } from 'react-intl';
import { Enrollment } from 'types/Joanie';
import { Icon } from 'components/Icon';
import { Button } from 'components/Button';
import useDateFormat from 'utils/useDateFormat';

const messages = {
  statusClosed: {
    id: 'components.DashboardItemEnrollment.statusClosed',
    description: '',
    defaultMessage: 'CLOSED • Finished on {date}',
  },
  statusOpened: {
    id: 'components.DashboardItemEnrollment.statusOpened',
    description: '',
    defaultMessage: 'COURSE OPEN • Started on {date}',
  },
  statusNotActive: {
    id: 'components.DashboardItemEnrollment.statusNotActive',
    description: '',
    defaultMessage: 'NOT ENROLLED',
  },
  accessCourse: {
    id: 'components.DashboardItemEnrollment.gotoCourse',
    description: '',
    defaultMessage: 'ACCESS COURSE',
  },
};

export const DashboardItemEnrollmentFooter = ({ enrollment }: { enrollment: Enrollment }) => {
  return (
    <>
      <div className="dashboard-item__block__status">
        <Icon name="icon-school" />
        <DashboardItemEnrollmentStatus enrollment={enrollment} />
      </div>
      <Button
        color="outline-primary"
        href={enrollment.course_run.resource_link}
        data-testid="dashboard-item-enrollment__button"
      >
        <FormattedMessage {...messages.accessCourse} />
      </Button>
    </>
  );
};

const DashboardItemEnrollmentStatus = ({ enrollment }: { enrollment: Enrollment }) => {
  const formatDate = useDateFormat();

  if (!enrollment.is_active) {
    return <FormattedMessage {...messages.statusNotActive} />;
  }

  const isClosed = new Date(enrollment.course_run.end) <= new Date();
  if (isClosed) {
    return (
      <FormattedMessage
        {...messages.statusClosed}
        values={{
          date: formatDate(enrollment.course_run.end),
        }}
      />
    );
  }

  return (
    <FormattedMessage
      {...messages.statusOpened}
      values={{
        date: formatDate(enrollment.course_run.start),
      }}
    />
  );
};
