import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { capitalize } from 'lodash-es';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import { DashboardSidebar } from 'widgets/Dashboard/components/DashboardSidebar';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { useCourse } from 'hooks/useCourses';
import { Spinner } from 'components/Spinner';
import { Icon, IconTypeEnum } from 'components/Icon';
import { useCourseProductRelation } from 'hooks/useCourseProductRelation';

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
  const { courseId, courseProductRelationId = '' } = useParams<{
    courseId: string;
    courseProductRelationId: string;
  }>();

  const {
    item: singleCourse,
    states: { fetching: courseFetching },
  } = useCourse(courseId!);
  const {
    item: courseProductRelation,
    states: { fetching: courseProductRelationFetching },
  } = useCourseProductRelation(courseProductRelationId);
  const fetching = useMemo(
    () => courseFetching || courseProductRelationFetching,
    [courseFetching, courseProductRelationFetching],
  );
  const product = useMemo(
    () => (courseProductRelation ? courseProductRelation.product : undefined),
    [courseProductRelation],
  );
  const course = useMemo(
    () => (courseProductRelation ? courseProductRelation.course : singleCourse),
    [courseProductRelation, singleCourse],
  );

  const menuLinks = [TeacherDashboardPaths.COURSE_GENERAL_INFORMATIONS].map((path) => ({
    to: getRoutePath(path, { courseId }),
    label: getRouteLabel(path),
  }));

  if (courseProductRelationId) {
    menuLinks.shift();
    menuLinks.unshift({
      to: getRoutePath(TeacherDashboardPaths.COURSE_PRODUCT, {
        courseId,
        courseProductRelationId,
      }),
      label: getRouteLabel(TeacherDashboardPaths.COURSE_PRODUCT),
    });
  }

  return (
    <DashboardSidebar
      menuLinks={menuLinks}
      header={
        course === undefined
          ? ''
          : capitalize(
              intl.formatMessage(messages.header, {
                courseTitle: product ? product.title : course.title,
              }),
            )
      }
      subHeader={intl.formatMessage(messages.subHeader)}
    >
      {fetching ? (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      ) : (
        <a className="syllabus-link" href={`/${intl.locale.split('-')[0]}/courses/${course.code}`}>
          <Icon name={IconTypeEnum.LOGOUT_SQUARE} />
          <span>
            <FormattedMessage {...messages.syllabusLinkLabel} />
          </span>
        </a>
      )}
    </DashboardSidebar>
  );
};
