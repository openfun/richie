import { defineMessages, FormattedMessage, IntlShape } from 'react-intl';
import { capitalize } from 'lodash-es';
import { Button } from '@openfun/cunningham-react';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CourseStateTextEnum, Priority } from 'types';
import { CourseRun } from 'types/Joanie';
import CourseRunListCell from './CourseRunListCell';

export const messages = defineMessages({
  dataCourseRunPeriod: {
    defaultMessage: 'From {from} {to, select, undefined {} other {to {to}}}',
    description: 'Message displayed in course run datagrid for course run period',
    id: 'components.CourseRunList.dataCourseRunPeriod',
  },
  dataCourseRunLink: {
    defaultMessage: 'Go to course area',
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
          to: courseRun.end ? intl.formatDate(new Date(courseRun.end)) : undefined,
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
          href={courseRun.resource_link}
          color="secondary"
          size="small"
          icon={<Icon name={IconTypeEnum.LOGOUT_SQUARE} size="small" />}
        >
          <FormattedMessage {...messages.dataCourseRunLink} />
        </Button>
      </CourseRunListCell>
    ),
  }));
};
