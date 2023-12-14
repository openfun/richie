import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { capitalize } from 'lodash-es';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardCourseSidebar } from 'widgets/Dashboard/components/TeacherDashboardCourseSidebar';
import { useCourse } from 'hooks/useCourses';
import { Spinner } from 'components/Spinner';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Icon, IconTypeEnum } from 'components/Icon';
import { useCourseRuns } from 'hooks/useCourseRuns';
import Banner, { BannerType } from 'components/Banner';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import CourseRunList from './CourseRunList';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Course area',
    description: 'Use for the page title of the course area',
    id: 'components.TeacherDashboardCourseLoader.pageTitle',
  },
  errorNoCourse: {
    defaultMessage: "This course doesn't exist",
    description: 'Message displayed when requested course is not found',
    id: 'components.TeacherDashboardCourseLoader.errorNoCourse',
  },
  loading: {
    defaultMessage: 'Loading course...',
    description: 'Message displayed while loading a course',
    id: 'components.TeacherDashboardCourseLoader.loading',
  },
});

export const TeacherDashboardCourseLoader = () => {
  const intl = useIntl();
  const { courseId, organizationId } = useParams<{
    courseId?: string;
    organizationId?: string;
    courseCodeAndProductId?: string;
  }>();

  const {
    item: course,
    states: { fetching: fetchingCourse },
  } = useCourse(courseId, { organization_id: organizationId });
  const {
    items: courseRuns,
    states: { fetching: fetchingCourseRuns },
  } = useCourseRuns({ course_id: course?.id }, { enabled: !!course });
  const fetching = fetchingCourse || fetchingCourseRuns;
  useBreadcrumbsPlaceholders({
    courseTitle: course?.title ?? '',
  });

  return (
    <DashboardLayout sidebar={<TeacherDashboardCourseSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>

      {fetching && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}

      {!fetching && !course && (
        <Banner
          message={intl.formatMessage(messages.errorNoCourse)}
          type={BannerType.ERROR}
          rounded
        />
      )}

      {!fetching && course && (
        <div className="teacher-course-page">
          <DashboardCard
            className="icon-arrow-right-rounded"
            header={
              <div className="dashboard__title_container--large">
                <h2 className="dashboard__title--small">
                  <Icon name={IconTypeEnum.ARROW_RIGHT_ROUNDED} />
                  <span className="dashboard__text_icon_left">{capitalize(course.title)}</span>
                </h2>
              </div>
            }
            expandable={false}
            fullWidth
          >
            <CourseRunList courseRuns={courseRuns} />
          </DashboardCard>
        </div>
      )}
    </DashboardLayout>
  );
};
