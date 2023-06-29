import { Button } from '@openfun/cunningham-react';
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
      <Button fullWidth onClick={props.onUnenroll}>
        <FormattedMessage {...messages.unenroll} />
      </Button>
    </div>
  );
};
