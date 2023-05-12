import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import { DashboardSidebar } from 'widgets/Dashboard/components/DashboardSidebar';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { useCourse } from 'hooks/useCourses';
import { Spinner } from 'components/Spinner';
import { getCourseUrl } from 'widgets/Dashboard/utils/course';
import SyllabusLink from '../SyllabusLink';

export const messages = defineMessages({
  header: {
    id: 'components.TeacherCourseDashboardSidebar.header',
    description: 'Title of the course dashboard sidebar',
    defaultMessage: '{courseTitle}',
  },
  subHeader: {
    id: 'components.TeacherCourseDashboardSidebar.subHeader',
    description: 'Sub title of the course dashboard sidebar',
    defaultMessage: 'You are on the course dashboard',
  },
  syllabusLinkLabel: {
    id: 'components.TeacherCourseDashboardSidebar.syllabusLinkLabel',
    description: 'Syllabus link label',
    defaultMessage: 'Accéder au syllabus',
  },
  loading: {
    defaultMessage: 'Loading course...',
    description: 'Message displayed while loading a course',
    id: 'components.TeacherCourseDashboardSidebar.loading',
  },
});

export const TeacherCourseDashboardSidebar = () => {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const { courseCode } = useParams<{ courseCode: string }>();
  const { item: course } = useCourse(courseCode!);

  const links = useMemo(
    () =>
      course === undefined
        ? []
        : [
            TeacherDashboardPaths.COURSE,
            // FIXME: we cannot build COURSE_CLASSROOMS url untile we get a courseRunId to load
            // TeacherDashboardPaths.COURSE_CLASSROOMS,
            TeacherDashboardPaths.COURSE_RECORDS,
            TeacherDashboardPaths.COURSE_STUDENTS,
            TeacherDashboardPaths.COURSE_SETTINGS,
          ].map((path) => ({
            to: getRoutePath(path, { courseCode: course.code }),
            label: getRouteLabel(path),
          })),
    [course?.code],
  );

  return (
    <DashboardSidebar
      menuLinks={links}
      header={
        course === undefined
          ? ''
          : intl.formatMessage(messages.header, { courseTitle: course.title })
      }
      subHeader={intl.formatMessage(messages.subHeader)}
    >
      {course === undefined ? (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      ) : (
        <SyllabusLink
          className="dashboard-sidebar__link-bottom"
          href={getCourseUrl(course.code, intl)}
        >
          <FormattedMessage {...messages.syllabusLinkLabel} />
        </SyllabusLink>
      )}
    </DashboardSidebar>
  );
};
