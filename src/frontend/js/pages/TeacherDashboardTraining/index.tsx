import { defineMessages, useIntl } from 'react-intl';

import { capitalize } from 'lodash-es';
import CourseRunList from 'pages/TeacherDashboardCourseLoader/CourseRunList';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Icon, IconTypeEnum } from 'components/Icon';
import Banner, { BannerType } from 'components/Banner';
import { CourseProductRelation } from 'types/Joanie';

const messages = defineMessages({
  errorNoCourseProductRelation: {
    defaultMessage: "This product doesn't exist",
    description: 'Message displayed when requested course product relation is not found',
    id: 'components.TeacherDashboardTraining.errorNoCourseProductRelation',
  },
});

interface TeacherDashboardTrainingProps {
  courseProductRelation: CourseProductRelation;
}

export const TeacherDashboardTraining = ({
  courseProductRelation,
}: TeacherDashboardTrainingProps) => {
  const intl = useIntl();
  return courseProductRelation ? (
    <div className="teacher-course-page">
      <DashboardCard
        className="icon-arrow-right-rounded"
        header={
          <div>
            <div className="dashboard__title_container--small">
              <h2 className="dashboard__title--large">
                {capitalize(courseProductRelation.product.title)}
              </h2>
            </div>
            {courseProductRelation.product.description && (
              <div className="dashboard__quote">{courseProductRelation.product.description}</div>
            )}
          </div>
        }
        expandable={false}
        fullWidth
      />
      <DashboardLayout.NestedSection>
        {courseProductRelation.product.target_courses.map((course) => (
          <DashboardLayout.Section key={`course_target_${course.code}`}>
            <DashboardCard
              className="icon-arrow-right-rounded"
              header={
                <div className="dashboard__title_container--large">
                  <h2 className="dashboard__title--small">
                    <Icon name={IconTypeEnum.ARROW_RIGHT_ROUNDED} />
                    <span className="dashboard__text_icon_left">{capitalize(course.title)}</span>
                  </h2>
                </div>
              }
              expandable={false}
              fullWidth
            >
              <CourseRunList courseRuns={course.course_runs} />
            </DashboardCard>
          </DashboardLayout.Section>
        ))}
      </DashboardLayout.NestedSection>
    </div>
  ) : (
    <Banner
      message={intl.formatMessage(messages.errorNoCourseProductRelation)}
      type={BannerType.ERROR}
      rounded
    />
  );
};

export { TeacherDashboardTrainingLoader } from './TeacherDashboardTrainingLoader';
