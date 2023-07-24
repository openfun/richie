import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { CourseRun } from 'types';
import useDateFormat from 'hooks/useDateFormat';
import { StringHelper } from 'utils/StringHelper';

const messages = defineMessages({
  courseRunTitleWithDates: {
    id: 'components.CourseRunItem.courseRunTitleWithDates',
    description: 'Course run details displayed on the syllabus',
    defaultMessage: '{title}, from {start} to {end}',
  },
  courseRunWithDates: {
    id: 'components.CourseRunItem.courseRunWithDates',
    description: 'Course run details displayed on the syllabus when it has no title',
    defaultMessage: 'From {start} to {end}',
  },
});

type Props = {
  item: CourseRun;
};

const CourseRunItem = ({ item }: Props) => {
  const formatDate = useDateFormat();

  return item.title ? (
    <FormattedMessage
      {...messages.courseRunTitleWithDates}
      values={{
        start: item.start ? formatDate(item.start) : '...',
        end: item.end ? formatDate(item.end) : '...',
        title: StringHelper.capitalizeFirst(item.title),
      }}
    />
  ) : (
    <FormattedMessage
      {...messages.courseRunWithDates}
      values={{
        start: item.start ? formatDate(item.start) : '...',
        end: item.end ? formatDate(item.end) : '...',
      }}
    />
  );
};

export default CourseRunItem;
