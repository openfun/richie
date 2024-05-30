import { useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import useDateFormat from 'hooks/useDateFormat';

const messages = defineMessages({
  enrollFrom: {
    defaultMessage: 'Enrollment from {date}',
    description: 'Text label for the enrollment dates when enrollment is not yet opened',
    id: 'components.EnrollmentDate.enrollFrom',
  },
  enrollSince: {
    defaultMessage: 'Enrollment open since {date}',
    description: 'Text label for the enrollment dates when enrollment opened and never closed',
    id: 'components.EnrollmentDate.enrollSince',
  },
  enrollUntil: {
    defaultMessage: 'Enrollment until {date}',
    description: 'Text label for the enrollment dates when enrollment is opened',
    id: 'components.EnrollmentDate.enrollUntil',
  },
  enrollClosed: {
    defaultMessage: 'Enrollment closed since {date}',
    description: 'Text label for the enrollment dates when enrollment is passed',
    id: 'components.EnrollmentDate.enrollClosed',
  },
});

type Props = {
  enrollment_start: Date | string | number;
  enrollment_end: Date | string | number;
  formatOptions?: Intl.DateTimeFormatOptions;
};

const EnrollmentDate = ({ enrollment_start, enrollment_end, formatOptions = {} }: Props) => {
  const formatDate = useDateFormat(formatOptions);
  const isOpened = useMemo(() => {
    return new Date() >= new Date(enrollment_start);
  }, [enrollment_start]);
  const isClosed = useMemo(() => {
    if (!enrollment_end) return false;
    return new Date() >= new Date(enrollment_end);
  }, [enrollment_end]);

  if (isClosed) {
    return (
      <FormattedMessage
        {...messages.enrollClosed}
        values={{
          date: formatDate(enrollment_end),
        }}
      />
    );
  }

  if (isOpened && !enrollment_end) {
    return (
      <FormattedMessage
        {...messages.enrollSince}
        values={{
          date: formatDate(enrollment_start),
        }}
      />
    );
  }

  if (isOpened) {
    return (
      <FormattedMessage
        {...messages.enrollUntil}
        values={{
          date: formatDate(enrollment_end),
        }}
      />
    );
  }

  return (
    <FormattedMessage
      {...messages.enrollFrom}
      values={{
        date: formatDate(enrollment_start),
      }}
    />
  );
};

export default EnrollmentDate;
