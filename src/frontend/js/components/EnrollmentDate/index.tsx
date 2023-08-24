import { useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import useDateFormat from 'hooks/useDateFormat';

const messages = defineMessages({
  enrollFrom: {
    defaultMessage: 'Enrollment from {date}',
    description: 'Text label for the enrollment dates when enrollment is not yet opened',
    id: 'components.EnrollmentDate.enrollFrom',
  },
  enrollUntil: {
    defaultMessage: 'Enrollment until {date}',
    description: 'Text label for the enrollment dates when enrollment is opened',
    id: 'components.EnrollmentDate.enrollUntil',
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
