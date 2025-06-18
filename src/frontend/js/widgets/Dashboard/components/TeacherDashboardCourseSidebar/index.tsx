import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { generatePath, useParams } from 'react-router';
import { useMemo } from 'react';
import { capitalize } from 'lodash-es';
import { useOffer } from 'hooks/useOffer';
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
    offerId: routeofferId = '',
  } = useParams<{
    organizationId?: string;
    courseId: string;
    offerId: string;
  }>();

  const {
    item: singleCourse,
    states: { fetching: courseFetching },
  } = useCourse(
    routeCourseId,
    { organization_id: routeOrganizationId },
    { enabled: !routeofferId },
  );

  const {
    item: offer,
    states: { fetching: offerFetching },
  } = useOffer(
    routeofferId,
    {
      organization_id: routeOrganizationId,
    },
    { enabled: !!routeofferId },
  );

  const fetching = useMemo(() => courseFetching || offerFetching, [courseFetching, offerFetching]);
  const product = useMemo(() => (offer ? offer.product : undefined), [offer]);
  const course = useMemo(() => (offer ? offer.course : singleCourse), [offer, singleCourse]);

  const getMenuLinkFromPath = (basePath: TeacherDashboardPaths) => {
    const path = generatePath(basePath, {
      organizationId: routeOrganizationId ?? '',
      courseId: routeCourseId ?? '',
      offerId: routeofferId ?? '',
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
          offerId={routeofferId}
        />
      );
    }

    return menuLink;
  };
  const menuLinkList = useMemo(
    () =>
      getMenuRoutes({
        offerId: routeofferId,
        organizationId: routeOrganizationId,
      }).map(getMenuLinkFromPath),
    [routeOrganizationId, routeofferId],
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
