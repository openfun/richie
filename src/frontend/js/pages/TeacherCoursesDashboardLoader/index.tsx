import { useMemo } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';

import DashboardCourseList from 'components/DashboardCourseList';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherProfileDashboardSidebar } from 'widgets/Dashboard/components/TeacherProfileDashboardSidebar';
import TeacherCourseSearchFiltersBar from 'widgets/Dashboard/components/TeacherCourseSearchFilters';
import { CourseStatusFilter, CourseTypeFilter, TeacherCourseSearchFilters } from 'hooks/useCourses';
import { isEnumValue } from 'types/utils';

const messages = defineMessages({
  courses: {
    defaultMessage: 'Your courses',
    description: 'Filtered courses title',
    id: 'components.TeacherCoursesDashboardLoader.title.filteredCourses',
  },
  incoming: {
    defaultMessage: 'Incoming',
    description: 'Incoming courses title',
    id: 'components.TeacherCoursesDashboardLoader.title.incoming',
  },
  ongoing: {
    defaultMessage: 'Ongoing',
    description: 'Ongoing courses title',
    id: 'components.TeacherCoursesDashboardLoader.title.ongoing',
  },
  archived: {
    defaultMessage: 'Archived',
    description: 'Archived courses title',
    id: 'components.TeacherCoursesDashboardLoader.title.archived',
  },
});

export const TeacherCoursesDashboardLoader = () => {
  const intl = useIntl();
  const [searchParams] = useSearchParams({
    status: CourseStatusFilter.ALL,
    type: CourseTypeFilter.ALL,
  });
  const filters = useMemo<TeacherCourseSearchFilters>(() => {
    const queryStatus = searchParams.get('status') || '';
    const queryType = searchParams.get('type') || '';
    return {
      status: isEnumValue(queryStatus, CourseStatusFilter) ? queryStatus : CourseStatusFilter.ALL,
      type: isEnumValue(queryType, CourseTypeFilter) ? queryType : CourseTypeFilter.ALL,
    };
  }, [searchParams.get('status'), searchParams.get('type')]);

  return (
    <DashboardLayout
      sidebar={<TeacherProfileDashboardSidebar />}
      filters={<TeacherCourseSearchFiltersBar filters={filters} />}
    >
      <div className="teacher-courses-page">
        {filters.status === CourseStatusFilter.ALL ? (
          <>
            <DashboardCourseList
              titleTranslated={intl.formatMessage(messages.incoming)}
              filters={{ ...filters, status: CourseStatusFilter.INCOMING, perPage: 3 }}
            />
            <DashboardCourseList
              titleTranslated={intl.formatMessage(messages.ongoing)}
              filters={{ ...filters, status: CourseStatusFilter.ONGOING, perPage: 3 }}
            />
            <DashboardCourseList
              titleTranslated={intl.formatMessage(messages.archived)}
              filters={{ ...filters, status: CourseStatusFilter.ARCHIVED, perPage: 3 }}
            />
          </>
        ) : (
          <DashboardCourseList
            titleTranslated={intl.formatMessage(messages.courses)}
            filters={filters}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
