import { defineMessages, useIntl } from 'react-intl';

import { capitalize } from 'lodash-es';
import CourseRunList from 'pages/TeacherDashboardCourseLoader/CourseRunList';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Icon, IconTypeEnum } from 'components/Icon';
import Banner, { BannerType } from 'components/Banner';
import { Offer } from 'types/Joanie';

const messages = defineMessages({
  errorNoOffer: {
    defaultMessage: "This product doesn't exist",
    description: 'Message displayed when requested offer is not found',
    id: 'components.TeacherDashboardTraining.errorNoOffer',
  },
});

interface TeacherDashboardTrainingProps {
  offer: Offer;
}

export const TeacherDashboardTraining = ({ offer }: TeacherDashboardTrainingProps) => {
  const intl = useIntl();
  return offer ? (
    <div className="teacher-course-page">
      <DashboardCard
        className="icon-arrow-right-rounded"
        header={
          <div>
            <div className="dashboard__title_container--small">
              <h2 className="dashboard__title--large">{capitalize(offer.product.title)}</h2>
            </div>
            {offer.product.description && (
              <div className="dashboard__quote">{offer.product.description}</div>
            )}
          </div>
        }
        expandable={false}
        fullWidth
      />
      <DashboardLayout.NestedSection>
        {offer.product.target_courses.map((course) => (
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
    <Banner message={intl.formatMessage(messages.errorNoOffer)} type={BannerType.ERROR} rounded />
  );
};

export { TeacherDashboardTrainingLoader } from './TeacherDashboardTrainingLoader';
