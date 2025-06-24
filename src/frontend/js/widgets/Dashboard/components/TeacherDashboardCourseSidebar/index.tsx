import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { generatePath, useParams } from 'react-router';
import { useMemo } from 'react';
import { capitalize } from 'lodash-es';
import { useOffering } from 'hooks/useOffering';
import { DashboardSidebar, MenuLink } from 'widgets/Dashboard/components/DashboardSidebar';
import { getDashboardRouteLabel } from 'widgets/Dashboard/utils/dashboardRoutes';
import { useCourse } from 'hooks/useCourses';
import { Spinner } from 'components/Spinner';
import { Icon, IconTypeEnum } from 'components/Icon';
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
    offeringId: routeOfferingId = '',
  } = useParams<{
    organizationId?: string;
    courseId: string;
    offeringId: string;
  }>();

  const {
    item: singleCourse,
    states: { fetching: courseFetching },
  } = useCourse(
    routeCourseId,
    { organization_id: routeOrganizationId },
    { enabled: !routeOfferingId },
  );

  const {
    item: offering,
    states: { fetching: offeringFetching },
  } = useOffering(
    routeOfferingId,
    {
      organization_id: routeOrganizationId,
    },
    { enabled: !!routeOfferingId },
  );

  const fetching = useMemo(
    () => courseFetching || offeringFetching,
    [courseFetching, offeringFetching],
  );
  const product = useMemo(() => (offering ? offering.product : undefined), [offering]);
  const course = useMemo(
    () => (offering ? offering.course : singleCourse),
    [offering, singleCourse],
  );

  const getMenuLinkFromPath = (basePath: TeacherDashboardPaths) => {
    const path = generatePath(basePath, {
      organizationId: routeOrganizationId ?? '',
      courseId: routeCourseId ?? '',
      offeringId: routeOfferingId ?? '',
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
          offeringId={routeOfferingId}
        />
      );
    }

    return menuLink;
  };
  const menuLinkList = useMemo(
    () =>
      getMenuRoutes({
        offeringId: routeOfferingId,
        organizationId: routeOrganizationId,
      }).map(getMenuLinkFromPath),
    [routeOrganizationId, routeOfferingId],
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
