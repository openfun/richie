import { FormattedMessage, defineMessages } from 'react-intl';

import { useParams, useSearchParams } from 'react-router-dom';
import { SortModel, usePagination } from '@openfun/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { TeacherDashboardCourseSidebar } from 'widgets/Dashboard/components/TeacherDashboardCourseSidebar';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { useCourseOrders } from 'hooks/useCourseOrders';
import { PER_PAGE } from 'settings';
import Banner, { BannerType } from 'components/Banner';
import { CourseOrderResourceQuery, Organization } from 'types/Joanie';
import { useOrganizations } from 'hooks/useOrganizations';
import { Spinner } from 'components/Spinner';
import CourseLearnerDataGrid from './components/CourseLearnerDataGrid';
import useCourseLearnersFilters from './hooks/useCourseLearnersFilters';
import CourseLearnersFiltersBar from './components/CourseLearnersFiltersBar';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Learners',
    description: "Use for the page title of the course's contracts page",
    id: 'pages.TeacherDashboardCourseLearnersLayout.pageTitle',
  },
  totalLearnerText: {
    defaultMessage:
      '{nbLearners} {nbLearners, plural, one {learner is enrolled} other {learners are enrolled}} for this training',
    description: 'Text to indicate the total number of learner on a training',
    id: 'pages.TeacherDashboardCourseLearnersLayout.totalLearnerText',
  },
});

export const TeacherDashboardCourseLearnersLayout = () => {
  const { organizationId: routeOrganizationId } = useParams<{
    organizationId?: Organization['id'];
  }>();
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') ?? '1';
  const pagination = usePagination({
    defaultPage: page ? parseInt(page, 10) : 1,
    pageSize: PER_PAGE.teacherContractList,
  });
  const [sortModel, setSortModel] = useState<SortModel>([
    {
      field: 'created_on',
      sort: 'desc',
    },
  ]);

  // our list is always ordered by created_on asc or desc
  // here we remove the neutral position that remove the "sortable" arrow icon.
  const handleSetSortModel = (model: SortModel) => {
    setSortModel(
      model.length === 0
        ? [
            {
              field: 'created_on',
              sort: 'asc',
            },
          ]
        : model,
    );
  };

  const { filters, setFilters } = useCourseLearnersFilters();
  const {
    items: organizations,
    states: { isFetched: isOrganizationFetched },
  } = useOrganizations({ course_product_relation_id: filters.course_product_relation_id });
  const {
    items: courseOrders,
    meta,
    states: { fetching, isFetched, error },
  } = useCourseOrders(
    {
      ...filters,
      page: pagination.page,
      page_size: PER_PAGE.courseLearnerList,
    },
    { enabled: isOrganizationFetched },
  );

  const showFilters = useMemo(() => {
    return !routeOrganizationId && isOrganizationFetched && organizations.length > 1;
  }, [isOrganizationFetched, organizations.length, routeOrganizationId]);

  const onFiltersChange = (newFilters: Partial<CourseOrderResourceQuery>) => {
    // Reset pagination
    pagination.setPage(1);
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
  };

  useEffect(() => {
    if (isFetched && meta?.pagination?.count) {
      pagination.setPagesCount(Math.ceil(meta!.pagination!.count / PER_PAGE.teacherContractList));
    }
  }, [meta, isFetched]);

  if (error) {
    return <Banner message={error} type={BannerType.ERROR} rounded />;
  }

  if (!isOrganizationFetched) {
    return <Spinner aria-labelledby="loading-organizations" />;
  }

  return (
    <DashboardLayout sidebar={<TeacherDashboardCourseSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
        {!!meta?.pagination?.count && (
          <div className="list__count-description">
            <FormattedMessage
              {...messages.totalLearnerText}
              values={{ nbLearners: meta?.pagination.count }}
            />
          </div>
        )}
      </div>
      <div className="teacher-training-learners-page">
        {showFilters && (
          <div className="dashboard__page__actions">
            <CourseLearnersFiltersBar
              defaultValues={filters}
              organizationList={organizations}
              onFiltersChange={onFiltersChange}
            />
          </div>
        )}
        <CourseLearnerDataGrid
          courseOrders={courseOrders}
          sortModel={sortModel}
          setSortModel={handleSetSortModel}
          pagination={pagination}
          isLoading={fetching}
        />
      </div>
    </DashboardLayout>
  );
};
