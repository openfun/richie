import { FormattedMessage } from 'react-intl';
import { useMemo } from 'react';
import { CoursesHelper } from 'utils/CoursesHelper';
import { Priority } from 'types';
import { useEnroll } from 'hooks/useEnroll';
import { AbstractCourse, CourseRun, Enrollment, Order } from 'types/Joanie';
import { RouterButton } from 'components/RouterButton';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { Icon } from '../Icon';
import { Button } from '../Button';
import useDateFormat, { DATETIME_FORMAT } from '../../utils/useDateFormat';

const messages = {
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
  statusClosed: {
    id: 'components.DashboardItemEnrollment.statusClosed',
    description: 'Text shown on a closed course run',
    defaultMessage: 'CLOSED • Occurred on {startDate} - {endDate}',
  },
  statusOpened: {
    id: 'components.DashboardItemEnrollment.statusOpened',
    description: 'Text shown on a enrolled course run',
    defaultMessage: 'OPEN • Happens on {startDate} - {endDate}',
  },
  statusNotActive: {
    id: 'components.DashboardItemEnrollment.statusNotActive',
    description: 'Text shown when a course run is not active',
    defaultMessage: 'Not enrolled',
  },
  accessCourse: {
    id: 'components.DashboardItemEnrollment.gotoCourse',
    description: 'Button to access course when the user is enrolled',
    defaultMessage: 'Access course',
  },
  runPeriod: {
    id: 'components.DashboardItemEnrollment.runPeriod',
    description: 'Text to display the period of a course run',
    defaultMessage: 'On {startDate} - {endDate}',
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
    description: 'Text displayed when no course run are opened for the course',
    id: 'components.DashboardItemCourseEnrollingRun.noCourseRunAvailable',
  },
};

interface Props {
  course: AbstractCourse;
  activeEnrollment?: Enrollment;
  order?: Order;
  writable?: boolean;
  icon?: boolean;
  notEnrolledUrl?: string;
}

export const DashboardItemCourseEnrolling = ({
  course,
  activeEnrollment,
  writable,
  order,
  icon = false,
  notEnrolledUrl = '#',
}: Props) => {
  return (
    <div data-testid={'dashboard-item__course-enrolling__' + course.code}>
      {!writable && (
        <div className="dashboard-item__course-enrolling__infos">
          {!!activeEnrollment && <Enrolled icon={icon} enrollment={activeEnrollment} />}
          {!activeEnrollment && <NotEnrolled icon={icon} notEnrolledUrl={notEnrolledUrl} />}
        </div>
      )}
      {writable && (
        <DashboardItemCourseEnrollingRuns
          course={course}
          enrollments={CoursesHelper.findCourseEnrollmentsInOrder(course, order!)}
          order={order}
        />
      )}
    </div>
  );
};

const DashboardItemCourseEnrollingRuns = ({
  course,
  enrollments,
  order,
}: {
  course: AbstractCourse;
  enrollments: Enrollment[];
  order?: Order;
}) => {
  const { enroll, isLoading, error } = useEnroll(enrollments, order);

  // Hide runs with finished enrollment.
  const datas = useMemo(
    () =>
      course.course_runs
        .map((courseRun) => ({
          courseRun,
          selected: !!enrollments.find(
            (enrollment) =>
              courseRun.resource_link === enrollment.course_run.resource_link &&
              enrollment.is_active,
          ),
        }))
        .filter(
          (data) => data.selected || data.courseRun.state.priority <= Priority.FUTURE_NOT_YET_OPEN,
        ),
    [course, enrollments],
  );

  // Filter by priority
  return (
    <div className="dashboard-item__course-enrolling__runs">
      {error && <Banner message={error} type={BannerType.ERROR} />}
      {datas.length === 0 && (
        <div className="dashboard-item__course-enrolling__no-runs">
          <Icon name="icon-warning" size="small" />
          <FormattedMessage {...messages.noCourseRunAvailable} />
        </div>
      )}
      {datas.map((data) => (
        <DashboardItemCourseEnrollingRun
          key={data.courseRun.id}
          courseRun={data.courseRun}
          selected={data.selected}
          enroll={() => enroll(data.courseRun)}
        />
      ))}
      {isLoading && (
        <div
          className="dashboard-item__course-enrolling__loading"
          data-testid="dashboard-item__course-enrolling__loading"
        >
          <Spinner size="large" />
        </div>
      )}
    </div>
  );
};

const DashboardItemCourseEnrollingRun = ({
  courseRun,
  selected,
  enroll,
}: {
  courseRun: CourseRun;
  selected: boolean;
  enroll: () => void;
}) => {
  const formatDate = useDateFormat();
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
          <FormattedMessage
            {...messages.runPeriod}
            values={{
              startDate: formatDate(courseRun.start, DATETIME_FORMAT),
              endDate: formatDate(courseRun.end, DATETIME_FORMAT),
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
        {selected && (
          <div className="dashboard-item__course-enrolling__run__enrolled">
            <FormattedMessage {...messages.enrolled} />
            <Icon name="icon-check" size="small" />
          </div>
        )}
        {!selected && (
          <Button disabled={!isOpenedForEnrollment} color="outline-primary" onClick={enroll}>
            <FormattedMessage {...messages.enrollRun} />
          </Button>
        )}
      </div>
    </div>
  );
};

const NotEnrolled = ({ icon, notEnrolledUrl }: { icon: boolean; notEnrolledUrl: string }) => {
  return (
    <>
      <div className="dashboard-item__block__status">
        {icon && <Icon name="icon-school" />}
        <FormattedMessage {...messages.notEnrolled} />
      </div>
      <RouterButton
        color="outline-primary"
        href={notEnrolledUrl}
        data-testid="dashboard-item-enrollment__button"
      >
        <FormattedMessage {...messages.enrollCourse} />
      </RouterButton>
    </>
  );
};

const Enrolled = ({ icon, enrollment }: { icon: boolean; enrollment: Enrollment }) => {
  return (
    <>
      <div className="dashboard-item__block__status">
        {icon && <Icon name="icon-school" />}
        <EnrolledStatus enrollment={enrollment} />
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

const EnrolledStatus = ({ enrollment }: { enrollment: Enrollment }) => {
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
          startDate: formatDate(enrollment.course_run.start, DATETIME_FORMAT),
          endDate: formatDate(enrollment.course_run.end, DATETIME_FORMAT),
        }}
      />
    );
  }

  return (
    <FormattedMessage
      {...messages.statusOpened}
      values={{
        startDate: formatDate(enrollment.course_run.start, DATETIME_FORMAT),
        endDate: formatDate(enrollment.course_run.end, DATETIME_FORMAT),
      }}
    />
  );
};
