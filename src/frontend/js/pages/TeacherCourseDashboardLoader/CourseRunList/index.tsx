import { useIntl } from 'react-intl';
import { Column, DataList } from '@openfun/cunningham-react';
import { CourseRun } from 'types/Joanie';

import { buildCourseRunData } from './utils';

interface CourseRunListProps {
  courseRuns: CourseRun[];
}

const CourseRunList = ({ courseRuns }: CourseRunListProps) => {
  const intl = useIntl();
  const columns = ['title', 'period', 'status', 'action'].map(
    (field: string): Column => ({
      id: field,
      headerName: field,
      renderCell: (params) => params.row[field],
    }),
  );

  return (
    <div className="teacher-dashboard-course-run-list">
      <DataList columns={columns} rows={buildCourseRunData(intl, courseRuns)} />
    </div>
  );
};

export default CourseRunList;
