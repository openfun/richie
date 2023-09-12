import { FormattedMessage, IntlShape, defineMessages } from 'react-intl';
import { capitalize } from 'lodash-es';
import { Link } from 'react-router-dom';
import { IconTypeEnum } from 'components/Icon';
import { CourseStateTextEnum, Priority } from 'types';
import { CourseRun } from 'types/Joanie';
import CourseRunListCell from './CourseRunListCell';

export const messages = defineMessages({
  dataCourseRunPeriod: {
    defaultMessage: 'from {from} to {to}',
    description: 'Message displayed in course run datagrid for course run period',
    id: 'components.CourseRunList.dataCourseRunPeriod',
  },
  dataCourseRunLink: {
    defaultMessage: 'go to course area',
    description: 'Message displayed in course run datagrid for course run link',
    id: 'components.CourseRunList.dataCourseRunLink',
  },
});

export const buildCourseRunData = (intl: IntlShape, courseRuns: CourseRun[]) => {
  const CourseStateIconMap: Record<CourseStateTextEnum, IconTypeEnum> = {
    [CourseStateTextEnum.ENROLLMENT_OPENED]: IconTypeEnum.MORE,
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
        <Link
          to={courseRun.resource_link}
          // FIXME: cunningham should provider us a ButtonLink of some kind
          className="c__button c__button--secondary c__button--small "
        >
          <FormattedMessage {...messages.dataCourseRunLink} />
        </Link>
      </CourseRunListCell>
    ),
  }));
};
