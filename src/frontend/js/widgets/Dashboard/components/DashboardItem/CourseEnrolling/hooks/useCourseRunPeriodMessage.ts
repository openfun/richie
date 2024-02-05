import { defineMessages, useIntl } from 'react-intl';
import useDateRelative from 'hooks/useDateRelative';
import { Priority } from 'types';
import { CourseRun } from 'types/Joanie';
import useDateFormat, { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';

const messages = defineMessages({
  onGoingRunPeriod: {
    id: 'components.useCourseRunPeriodMessage.onGoingRunPeriod',
    description: 'Text to display when a course run is on going.',
    defaultMessage: 'This session started on {startDate} and will end on {endDate}',
  },
  futureRunPeriod: {
    id: 'components.useCourseRunPeriodMessage.futureRunPeriod',
    description: 'Text to display the period of a future course run.',
    defaultMessage: 'This session starts {relativeStartDate}, the {startDate}',
  },
  onGoingEnrolledRunPeriod: {
    id: 'components.useCourseRunPeriodMessage.onGoingEnrolledRunPeriod',
    description: 'Text to display when a course run is ongoing and the user is enrolled to.',
    defaultMessage: "You are enrolled for this session. It's open from {startDate} to {endDate}",
  },
  futureEnrolledRunPeriod: {
    id: 'components.useCourseRunPeriodMessage.futureEnrolledRunPeriod',
    description: 'Text to display when a course run is not yet opened and the user is enrolled to.',
    defaultMessage:
      'You are enrolled for this session. It starts {relativeStartDate}, the {startDate}.',
  },
  archivedEnrolledRunPeriod: {
    id: 'components.useCourseRunPeriodMessage.archivedEnrolledRunPeriod',
    description: 'Text to display when a course run is archived and the user is enrolled to.',
    defaultMessage: 'You are enrolled for this session.',
  },
});

const useCourseRunPeriodMessage = (courseRun: CourseRun, enrolled: boolean = false) => {
  const intl = useIntl();
  const formatDate = useDateFormat();

  const relativeStartDate = useDateRelative(new Date(courseRun.start));
  const startDate = formatDate(courseRun.start, DEFAULT_DATE_FORMAT);
  const endDate = formatDate(courseRun.end, DEFAULT_DATE_FORMAT);
  const isArchived = [Priority.ARCHIVED_CLOSED, Priority.ARCHIVED_OPEN].includes(
    courseRun.state.priority,
  );
  const isOnGoing = [Priority.ONGOING_OPEN, Priority.ONGOING_CLOSED].includes(
    courseRun.state.priority,
  );
  if (enrolled) {
    if (isArchived) {
      return intl.formatMessage(messages.archivedEnrolledRunPeriod);
    }
    if (isOnGoing) {
      return intl.formatMessage(messages.onGoingEnrolledRunPeriod, {
        startDate,
        endDate,
      });
    }
    return intl.formatMessage(messages.futureEnrolledRunPeriod, {
      relativeStartDate,
      startDate,
    });
  }
  if (isOnGoing) {
    return intl.formatMessage(messages.onGoingRunPeriod, {
      startDate,
      endDate,
    });
  }
  return intl.formatMessage(messages.futureRunPeriod, {
    relativeStartDate,
    startDate,
  });
};

export default useCourseRunPeriodMessage;
