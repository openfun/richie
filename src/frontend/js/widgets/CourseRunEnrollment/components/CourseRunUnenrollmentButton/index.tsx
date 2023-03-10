import * as React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  unenroll: {
    defaultMessage: 'Unenroll from this course',
    description:
      'Help text below the "Unenroll now" CTA when an enrollment attempt has already failed.',
    id: 'components.CourseRunUnenrollmentButton.unenroll',
  },
});

interface Props {
  onUnenroll: () => void;
}

export const CourseRunUnenrollButton = (props: Props) => {
  return (
    <div className="course-run-unenrollment">
      <button className="button course-run-unenrollment__button" onClick={props.onUnenroll}>
        <FormattedMessage {...messages.unenroll} />
      </button>
    </div>
  );
};
