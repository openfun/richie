import { useIntl } from 'react-intl';
import { DataList } from '@openfun/cunningham-react';
import { useNavigate } from 'react-router-dom';
import { CourseRun } from 'types/Joanie';

import { CourseMock } from 'api/mocks/joanie/courses';
import { buildCourseRunData } from './utils';

interface CourseRunListProps {
  courseCode: CourseMock['code'];
  courseRuns: CourseRun[];
}

const CourseRunList = ({ courseCode, courseRuns }: CourseRunListProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const columns = ['title', 'period', 'status', 'action'].map((field: string) => ({ field }));

  return (
    <div className="teacher-dashboard-course-run-list">
      <DataList
        columns={columns}
        rows={buildCourseRunData(intl, navigate, courseCode, courseRuns)}
      />
    </div>
  );
};

export default CourseRunList;
