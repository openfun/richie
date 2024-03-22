import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { generatePath, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { capitalize } from 'lodash-es';
import { DashboardSidebar, MenuLink } from 'widgets/Dashboard/components/DashboardSidebar';
import { getDashboardRouteLabel } from 'widgets/Dashboard/utils/dashboardRoutes';
import { useCourse } from 'hooks/useCourses';
import { Spinner } from 'components/Spinner';
import { Icon, IconTypeEnum } from 'components/Icon';
import { useCourseProductRelation } from 'hooks/useCourseProductRelation';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherDashboardPaths';
import ContractNavLink from '../DashboardSidebar/components/ContractNavLink';
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
  const getRouteLabel = getDashboardRouteLabel(intl);
  const {
    organizationId: routeOrganizationId,
    courseId: routeCourseId,
    courseProductRelationId: routeCourseProductRelationId = '',
  } = useParams<{
    organizationId?: string;
    courseId: string;
    courseProductRelationId: string;
  }>();

  const {
    item: singleCourse,
    states: { fetching: courseFetching },
  } = useCourse(
    routeCourseId,
    { organization_id: routeOrganizationId },
    { enabled: !routeCourseProductRelationId },
  );

  const {
    item: courseProductRelation,
    states: { fetching: courseProductRelationFetching },
  } = useCourseProductRelation(
    routeCourseProductRelationId,
    {
      organization_id: routeOrganizationId,
    },
    { enabled: !!routeCourseProductRelationId },
  );

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

  const getMenuLinkFromPath = (basePath: TeacherDashboardPaths) => {
    const path = generatePath(basePath, {
      organizationId: routeOrganizationId ?? '',
      courseId: routeCourseId ?? '',
      courseProductRelationId: routeCourseProductRelationId ?? '',
    });
    const menuLink: MenuLink = {
      to: path,
      label: getRouteLabel(basePath),
    };

    if (
      [
        TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS,
        TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS,
      ].includes(basePath)
    ) {
      menuLink.component = (
        <ContractNavLink
          link={menuLink}
          organizationId={routeOrganizationId}
          courseProductRelationId={routeCourseProductRelationId}
        />
      );
    }

    return menuLink;
  };
  const menuLinkList = useMemo(
    () =>
      getMenuRoutes({
        courseProductRelationId: routeCourseProductRelationId,
        organizationId: routeOrganizationId,
      }).map(getMenuLinkFromPath),
    [routeOrganizationId, routeCourseProductRelationId],
  );

  return (
    <DashboardSidebar
      menuLinks={menuLinkList}
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
