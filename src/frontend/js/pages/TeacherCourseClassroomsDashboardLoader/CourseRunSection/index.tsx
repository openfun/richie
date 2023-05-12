import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { capitalize } from 'lodash-es';
import { CourseMock } from 'api/mocks/joanie/courses';
import { CourseRun } from 'types/Joanie';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import SyllabusLink from 'widgets/Dashboard/components/SyllabusLink';
import { getCourseUrl } from 'widgets/Dashboard/utils/course';
import CourseRunLabel, {
  CourseRunLabelVariantEnum,
} from 'widgets/Dashboard/components/CourseRunLabel';

const messages = defineMessages({
  syllabusLinkLabel: {
    defaultMessage: 'Access the course',
    description: 'Message displayed in classrooms page for the syllabus link label',
    id: 'components.TeacherCourseClassroomsDashboardLoader.syllabusLinkLabel',
  },
  classroomPeriod: {
    defaultMessage: 'Session from {from} to {to}',
    description: 'Message displayed in classrooms page for classroom period',
    id: 'components.TeacherCourseClassroomsDashboardLoader.classroomPeriod',
  },
});

interface StudentsSectionProps {
  course: CourseMock;
  courseRun: CourseRun;
}

const CourseRunSection = ({ course, courseRun }: StudentsSectionProps) => {
  const intl = useIntl();

  return (
    <DashboardCard
      header={
        <div className="teacher-course-page__course-title__container-small dashboard-card__header__left">
          <h2 className="dashboard__title-h1 teacher-course-page__course-title dashboard-card__header__left">
            {capitalize(course.title)}
          </h2>
          <SyllabusLink href={getCourseUrl(course.code, intl)}>
            <FormattedMessage {...messages.syllabusLinkLabel} />
          </SyllabusLink>
        </div>
      }
      expandable={false}
    >
      {courseRun && (
        <span>
          <CourseRunLabel courseRun={courseRun} variant={CourseRunLabelVariantEnum.DATE} />
        </span>
      )}
    </DashboardCard>
  );
};
export default CourseRunSection;
