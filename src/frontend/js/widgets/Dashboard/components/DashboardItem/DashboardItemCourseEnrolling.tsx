import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { Button } from '@openfun/cunningham-react';
import { CoursesHelper } from 'utils/CoursesHelper';
import { Priority } from 'types';
import {
  CourseRun,
  Enrollment,
  CredentialOrder,
  AbstractCourse,
  Product,
  CertificateOrder,
} from 'types/Joanie';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import useDateFormat, { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { Icon, IconTypeEnum } from 'components/Icon';
import { orderNeedsSignature } from 'widgets/Dashboard/components/DashboardItem/utils/order';
import { RouterButton } from '../RouterButton';
import { useEnroll } from '../../hooks/useEnroll';

const messages = defineMessages({
  notEnrolled: {
    id: 'components.DashboardItemEnrollment.notEnrolled',
    description: 'Text shown on a read-only not-enrolled target course',
    defaultMessage: 'You are not enrolled in this course',
  },
  enrollCourse: {
    id: 'components.DashboardItemEnrollment.enrollCourse',
    description:
      'Button shown on a read-only not-enrolled target course that redirects to the details view',
    defaultMessage: 'Enroll',
  },
  statusNotActive: {
    id: 'components.DashboardItemEnrollment.statusNotActive',
    description: 'Text shown when a course run is not active',
    defaultMessage: 'Not enrolled',
  },
  accessCourse: {
    id: 'components.DashboardItemEnrollment.gotoCourse',
    description: 'Button to access course when the user is enrolled',
    defaultMessage: 'Access to course',
  },
  runPeriod: {
    id: 'components.DashboardItemEnrollment.runPeriod',
    description: 'Text to display the period of a course run',
    defaultMessage: 'From {startDate} to {endDate}',
  },
  enrolledRunPeriod: {
    id: 'components.DashboardItemEnrollment.enrolledRunPeriod',
    description: 'Text to display the period of a course run',
    defaultMessage: 'You are enrolled for the session from {startDate} to {endDate}',
  },
  enrolled: {
    id: 'components.DashboardItemEnrollment.enrolled',
    description: 'Text shown when user is enrolled in a course run',
    defaultMessage: 'Enrolled',
  },
  enrollRun: {
    id: 'components.DashboardItemEnrollment.enrollRun',
    description: 'Button to enroll in a course run',
    defaultMessage: 'Enroll',
  },
  enrollmentNotYetOpened: {
    defaultMessage: 'Enrollment will open on {enrollment_start}',
    description: 'Disclaimer that informs the user that enrollment is not yet opened',
    id: 'components.DashboardItemCourseEnrollingRun.enrollmentNotYetOpened',
  },
  noCourseRunAvailable: {
    defaultMessage: 'No session available for this course.',
    description: 'Text displayed when no course runs are opened for the course',
    id: 'components.DashboardItemCourseEnrollingRun.noCourseRunAvailable',
  },
  courseRunsLoading: {
    defaultMessage: 'Loading course runs...',
    description: 'Text displayed when course runs list is loading',
    id: 'components.DashboardItemCourseEnrollingRun.courseRunsLoading',
  },
  contractUnsigned: {
    id: 'components.DashboardItemCourseEnrollingRun.contractUnsigned',
    description: 'Message displayed as disabled button title when a contract needs to be signed.',
    defaultMessage: 'You have to sign the training contract before enrolling to your course.',
  },
});

interface DashboardItemCourseEnrollingProps {
  // how does it work ?!!
  // course should be a code from api serializer
  course: AbstractCourse;
  activeEnrollment?: Enrollment;
  order?: CredentialOrder;
  product?: Product;
  writable: boolean;
  hideEnrollButtons?: boolean;
  icon?: boolean;
  notEnrolledUrl?: string;
}

export const DashboardItemCourseEnrolling = ({
  course,
  activeEnrollment,
  writable,
  order,
  product,
  icon = false,
  notEnrolledUrl = '#',
  hideEnrollButtons,
}: DashboardItemCourseEnrollingProps) => {
  if (writable && !order) {
    throw new Error('Order is required when writable is true');
  }
  return (
    <div data-testid={'dashboard-item__course-enrolling__' + course.code}>
      {!writable && (
        <div className="dashboard-item__course-enrolling__infos">
          {activeEnrollment ? (
            <Enrolled icon={icon} enrollment={activeEnrollment} />
          ) : (
            <NotEnrolled
              icon={icon}
              notEnrolledUrl={notEnrolledUrl}
              hideEnrollButtons={hideEnrollButtons}
            />
          )}
        </div>
      )}
      {writable && order && (
        <DashboardItemCourseEnrollingRuns
          course={course}
          enrollments={CoursesHelper.findCourseEnrollmentsInOrder(course, order)}
          order={order}
          product={product}
        />
      )}
    </div>
  );
};

interface DashboardItemCourseEnrollingRunsProps {
  course: AbstractCourse;
  enrollments: Enrollment[];
  order?: CredentialOrder;
  product?: Product;
}

const DashboardItemCourseEnrollingRuns = ({
  course,
  enrollments,
  order,
  product,
}: DashboardItemCourseEnrollingRunsProps) => {
  const { enroll, isLoading, error } = useEnroll(enrollments, order);

  // Hide runs with finished enrollment.
  const datas = useMemo(() => {
    const activeEnrollment = CoursesHelper.findActiveEnrollment(course, enrollments);
    return course.course_runs
      .map((courseRun) => ({
        courseRun,
        selected: activeEnrollment?.course_run.id === courseRun.id,
      }))
      .filter(
        (data) => data.selected || data.courseRun.state.priority <= Priority.FUTURE_NOT_YET_OPEN,
      );
  }, [course, enrollments]);

  // Filter by priority
  return (
    <div className="dashboard-item__course-enrolling__runs">
      {error && <Banner message={error} type={BannerType.ERROR} />}
      {datas.length === 0 && (
        <div className="dashboard-item__course-enrolling__no-runs">
          <Icon name={IconTypeEnum.WARNING} size="small" />
          <FormattedMessage {...messages.noCourseRunAvailable} />
        </div>
      )}
      {datas.map((data) => (
        <DashboardItemCourseEnrollingRun
          key={data.courseRun.id}
          courseRun={data.courseRun}
          selected={data.selected}
          enroll={() => enroll(data.courseRun)}
          order={order}
          product={product}
        />
      ))}
      {isLoading && (
        <div
          className="dashboard-item__course-enrolling__loading"
          data-testid="dashboard-item__course-enrolling__loading"
        >
          <Spinner aria-labelledby="enrolling-loading" size="large">
            <span id="enrolling-loading">
              <FormattedMessage {...messages.courseRunsLoading} />
            </span>
          </Spinner>
        </div>
      )}
    </div>
  );
};

interface DashboardItemCourseEnrollingRunProps {
  courseRun: CourseRun;
  selected: boolean;
  enroll: () => void;
  order?: CredentialOrder | CertificateOrder;
  product?: Product;
}

const DashboardItemCourseEnrollingRun = ({
  courseRun,
  selected,
  enroll,
  order,
  product,
}: DashboardItemCourseEnrollingRunProps) => {
  const intl = useIntl();
  const formatDate = useDateFormat();
  const haveToSignContract = order ? orderNeedsSignature(order, product) : false;
  const isOpenedForEnrollment = useMemo(
    () => courseRun.state.priority < Priority.FUTURE_NOT_YET_OPEN,
    [courseRun],
  );

  return (
    <div
      className="dashboard-item__course-enrolling__run"
      data-testid={'dashboard-item__course-enrolling__run__' + courseRun.id}
    >
      <div>
        <div>
          <p className="dashboard-item__course-enrolling__run_title">
            {selected && (
              <Icon
                className="dashboard-item__course-enrolling__run__icon-enrolled"
                name={IconTypeEnum.CHECK}
              />
            )}
            <strong>{courseRun.title}</strong>
          </p>
          <FormattedMessage
            {...(selected ? messages.enrolledRunPeriod : messages.runPeriod)}
            values={{
              startDate: formatDate(courseRun.start, DEFAULT_DATE_FORMAT),
              endDate: formatDate(courseRun.end, DEFAULT_DATE_FORMAT),
            }}
          />
        </div>
        {!isOpenedForEnrollment && (
          <div className="dashboard-item__course-enrolling__run__not-opened">
            <FormattedMessage
              {...messages.enrollmentNotYetOpened}
              values={{ enrollment_start: formatDate(courseRun.enrollment_start) }}
            />
          </div>
        )}
      </div>
      <div>
        {selected ? (
          <Button
            color="secondary"
            size="small"
            href={courseRun.resource_link}
            data-testid="dashboard-item-enrollment__button"
            className="dashboard-item__button"
          >
            <FormattedMessage {...messages.accessCourse} />
          </Button>
        ) : (
          <Button
            disabled={!isOpenedForEnrollment || haveToSignContract}
            color="tertiary"
            size="small"
            onClick={enroll}
            title={haveToSignContract ? intl.formatMessage(messages.contractUnsigned) : ''}
          >
            <FormattedMessage {...messages.enrollRun} />
          </Button>
        )}
      </div>
    </div>
  );
};

const NotEnrolled = ({
  icon,
  notEnrolledUrl,
  hideEnrollButtons,
}: {
  icon: boolean;
  notEnrolledUrl: string;
  hideEnrollButtons?: boolean;
}) => {
  return (
    <>
      <div className="dashboard-item__block__status">
        {icon && <Icon name={IconTypeEnum.SCHOOL} />}
        <FormattedMessage {...messages.notEnrolled} />
      </div>
      {!hideEnrollButtons && (
        <RouterButton
          color="secondary"
          size="small"
          href={notEnrolledUrl}
          data-testid="dashboard-item-enrollment__button"
          className="dashboard-item__button"
        >
          <FormattedMessage {...messages.enrollCourse} />
        </RouterButton>
      )}
    </>
  );
};

const SHOW_ACCESS_COURSE_PRIORITIES = [
  Priority.ONGOING_OPEN,
  Priority.ARCHIVED_OPEN,
  Priority.ONGOING_CLOSED,
  Priority.ARCHIVED_CLOSED,
];

export const Enrolled = ({
  icon = false,
  enrollment,
}: {
  icon?: boolean;
  enrollment: Enrollment;
}) => {
  return (
    <>
      <div className="dashboard-item__block__status">
        {icon && <Icon name={IconTypeEnum.SCHOOL} />}
        <EnrolledStatus enrollment={enrollment} />
      </div>
      {SHOW_ACCESS_COURSE_PRIORITIES.includes(enrollment.course_run.state.priority) && (
        <Button
          color="secondary"
          size="small"
          href={enrollment.course_run.resource_link}
          data-testid="dashboard-item-enrollment__button"
          className="dashboard-item__button"
        >
          <FormattedMessage {...messages.accessCourse} />
        </Button>
      )}
    </>
  );
};

const EnrolledStatus = ({ enrollment }: { enrollment: Enrollment }) => {
  const formatDate = useDateFormat();

  if (!enrollment.is_active) {
    return <FormattedMessage {...messages.statusNotActive} />;
  }

  return (
    <FormattedMessage
      {...messages.enrolledRunPeriod}
      values={{
        startDate: formatDate(enrollment.course_run.start, DEFAULT_DATE_FORMAT),
        endDate: formatDate(enrollment.course_run.end, DEFAULT_DATE_FORMAT),
      }}
    />
  );
};
