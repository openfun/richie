import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { capitalize } from 'lodash-es';
import { DashboardSidebar } from 'widgets/Dashboard/components/DashboardSidebar';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { useCourse } from 'hooks/useCourses';
import { Spinner } from 'components/Spinner';
import { Icon, IconTypeEnum } from 'components/Icon';
import { useCourseProductRelation } from 'hooks/useCourseProductRelation';
import { getMenuRoutes } from './utils';

export const messages = defineMessages({
  header: {
    id: 'components.TeacherDashboardCourseSidebar.header',
    description: 'Title of the course dashboard sidebar',
    defaultMessage: '{courseTitle}',
  },
  subHeader: {
    id: 'components.TeacherDashboardCourseSidebar.subHeader',
    description: 'Sub title of the course dashboard sidebar',
    defaultMessage: 'You are on the course dashboard',
  },
  syllabusLinkLabel: {
    id: 'components.TeacherDashboardCourseSidebar.syllabusLinkLabel',
    description: 'Syllabus link label',
    defaultMessage: 'Go to syllabus',
  },
  loading: {
    defaultMessage: 'Loading course...',
    description: 'Message displayed while loading a course',
    id: 'components.TeacherDashboardCourseSidebar.loading',
  },
});

export const TeacherDashboardCourseSidebar = () => {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const {
    courseId,
    courseProductRelationId = '',
    organizationId,
  } = useParams<{
    courseId: string;
    courseProductRelationId: string;
    organizationId?: string;
  }>();

  const {
    item: singleCourse,
    states: { fetching: courseFetching },
  } = useCourse(courseId, { organization_id: organizationId });
  const {
    item: courseProductRelation,
    states: { fetching: courseProductRelationFetching },
  } = useCourseProductRelation(courseProductRelationId, { organization_id: organizationId });
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

  const menuLinks = getMenuRoutes({ courseProductRelationId, organizationId }).map((path) => ({
    to: getRoutePath(path, { courseId, courseProductRelationId, organizationId }),
    label: getRouteLabel(path),
  }));

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
        course && (
          <a className="syllabus-link" href={`/redirects/courses/${course.code}`}>
            <Icon name={IconTypeEnum.LOGOUT_SQUARE} size="small" />
            <span>
              <FormattedMessage {...messages.syllabusLinkLabel} />
            </span>
          </a>
        )
      )}
    </DashboardSidebar>
  );
};
