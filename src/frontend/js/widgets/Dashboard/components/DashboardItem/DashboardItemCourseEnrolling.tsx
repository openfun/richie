import { FormattedMessage } from 'react-intl';
import { useMemo } from 'react';
import { Button } from '@openfun/cunningham-react';
import { Button as RichieButton } from 'components/Button';
import { CoursesHelper } from 'utils/CoursesHelper';
import { Priority } from 'types';
import { AbstractCourse, CourseRun, Enrollment, Order } from 'types/Joanie';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import useDateFormat, { DATETIME_FORMAT } from 'hooks/useDateFormat';
import { Icon, IconTypeEnum } from 'components/Icon';
import { RouterButton } from '../RouterButton';
import { useEnroll } from '../../hooks/useEnroll';

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
            <NotEnrolled icon={icon} notEnrolledUrl={notEnrolledUrl} />
          )}
        </div>
      )}
      {writable && order && (
        <DashboardItemCourseEnrollingRuns
          course={course}
          enrollments={CoursesHelper.findCourseEnrollmentsInOrder(course, order)}
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
        {selected ? (
          <div className="dashboard-item__course-enrolling__run__enrolled">
            <FormattedMessage {...messages.enrolled} />
            <Icon name={IconTypeEnum.CHECK} size="small" />
          </div>
        ) : (
          <Button disabled={!isOpenedForEnrollment} color="secondary" onClick={enroll}>
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
        {icon && <Icon name={IconTypeEnum.SCHOOL} />}
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
        // FIXME: cunningham button should allow usage of href.
        <RichieButton
          color="outline-primary"
          href={enrollment.course_run.resource_link}
          data-testid="dashboard-item-enrollment__button"
        >
          <FormattedMessage {...messages.accessCourse} />
        </RichieButton>
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
        startDate: formatDate(enrollment.course_run.start, DATETIME_FORMAT),
        endDate: formatDate(enrollment.course_run.end, DATETIME_FORMAT),
      }}
    />
  );
};
