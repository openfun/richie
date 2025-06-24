import { defineMessages, useIntl } from 'react-intl';

import { capitalize } from 'lodash-es';
import CourseRunList from 'pages/TeacherDashboardCourseLoader/CourseRunList';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Icon, IconTypeEnum } from 'components/Icon';
import Banner, { BannerType } from 'components/Banner';
import { Offering } from 'types/Joanie';

const messages = defineMessages({
  errorNoOffering: {
    defaultMessage: "This product doesn't exist",
    description: 'Message displayed when requested offering is not found',
    id: 'components.TeacherDashboardTraining.errorNoOffering',
  },
});

interface TeacherDashboardTrainingProps {
  offering: Offering;
}

export const TeacherDashboardTraining = ({ offering }: TeacherDashboardTrainingProps) => {
  const intl = useIntl();
  return offering ? (
    <div className="teacher-course-page">
      <DashboardCard
        className="icon-arrow-right-rounded"
        header={
          <div>
            <div className="dashboard__title_container--small">
              <h2 className="dashboard__title--large">{capitalize(offering.product.title)}</h2>
            </div>
            {offering.product.description && (
              <div className="dashboard__quote">{offering.product.description}</div>
            )}
          </div>
        }
        expandable={false}
        fullWidth
      />
      <DashboardLayout.NestedSection>
        {offering.product.target_courses.map((course) => (
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
      message={intl.formatMessage(messages.errorNoOffering)}
      type={BannerType.ERROR}
      rounded
    />
  );
};

export { TeacherDashboardTrainingLoader } from './TeacherDashboardTrainingLoader';
