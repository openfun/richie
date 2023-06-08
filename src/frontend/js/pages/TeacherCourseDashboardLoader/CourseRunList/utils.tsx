import { FormattedMessage, IntlShape, defineMessages } from 'react-intl';
import { capitalize } from 'lodash-es';
import { Button } from '@openfun/cunningham-react';
import { NavigateFunction } from 'react-router-dom';
import { IconTypeEnum } from 'components/Icon';
import { CourseStateTextEnum, Priority } from 'types';
import { CourseRun } from 'types/Joanie';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { TeacherDashboardPaths } from 'widgets/Dashboard/utils/teacherRouteMessages';
import { CourseMock } from 'api/mocks/joanie/courses';
import CourseRunListCell from './CourseRunListCell';

export const messages = defineMessages({
  dataCourseRunPeriod: {
    defaultMessage: 'from {from} to {to}',
    description: 'Message displayed in course run datagrid for course run period',
    id: 'components.CourseRunList.dataCourseRunPeriod',
  },
  dataCourseRunLink: {
    defaultMessage: 'go to classroom',
    description: 'Message displayed in course run datagrid for course run link',
    id: 'components.CourseRunList.dataCourseRunLink',
  },
});

export const buildCourseRunData = (
  intl: IntlShape,
  navigate: NavigateFunction,
  courseCode: CourseMock['code'],
  courseRuns: CourseRun[],
) => {
  const getRoutePath = getDashboardRoutePath(intl);
  const CourseStateIconMap: Record<CourseStateTextEnum, IconTypeEnum> = {
    [CourseStateTextEnum.CLOSING_ON]: IconTypeEnum.MORE,
    [CourseStateTextEnum.STARTING_ON]: IconTypeEnum.CHECK_ROUNDED,
    [CourseStateTextEnum.ENROLLMENT_CLOSED]: IconTypeEnum.MORE,
    [CourseStateTextEnum.ON_GOING]: IconTypeEnum.MORE,
    [CourseStateTextEnum.ARCHIVED]: IconTypeEnum.ARCHIVE,
    [CourseStateTextEnum.TO_BE_SCHEDULED]: IconTypeEnum.STOPWATCH,
  };

  return courseRuns.map((courseRun: CourseRun) => ({
    id: courseRun.id,
    title: (
      <CourseRunListCell
        iconType={IconTypeEnum.CAMERA}
        textContent={capitalize(courseRun.title)}
        maxWidth={110}
      />
    ),
    period: (
      <CourseRunListCell
        textContent={intl.formatMessage(messages.dataCourseRunPeriod, {
          from: intl.formatDate(new Date(courseRun.start)),
          to: intl.formatDate(new Date(courseRun.end)),
        })}
        variant={CourseRunListCell.SMALL}
      />
    ),
    status: (
      <CourseRunListCell
        iconType={CourseStateIconMap[courseRun.state.text]}
        textContent={
          courseRun.state.priority !== Priority.FUTURE_OPEN
            ? capitalize(courseRun.state.text)
            : undefined
        }
      >
        {courseRun.state.priority === Priority.FUTURE_OPEN && courseRun.state.datetime && (
          <>
            {capitalize(courseRun.state.text)}
            <br />
            {intl.formatDate(courseRun.state.datetime)}
          </>
        )}
      </CourseRunListCell>
    ),
    action: (
      <CourseRunListCell variant={CourseRunListCell.ALIGN_RIGHT}>
        <Button
          size="small"
          color="secondary"
          onClick={() =>
            navigate(
              getRoutePath(TeacherDashboardPaths.COURSE_CLASSROOMS, {
                courseCode,
                courseRunId: courseRun.id,
              }),
            )
          }
        >
          <FormattedMessage {...messages.dataCourseRunLink} />
        </Button>
      </CourseRunListCell>
    ),
  }));
};
