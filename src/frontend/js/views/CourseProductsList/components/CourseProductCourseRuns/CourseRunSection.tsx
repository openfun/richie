import { PropsWithChildren } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

const messages = defineMessages({
  end: {
    defaultMessage: 'End',
    description: 'End label displayed in the header of course run dates section',
    id: 'components.CourseProductsList.end',
  },
  start: {
    defaultMessage: 'Start',
    description: 'Start label displayed in the header of course run dates section',
    id: 'components.CourseProductsList.start',
  },
});

const CourseRunSection = ({ children }: PropsWithChildren<{}>) => (
  <section className="course__course-runs">
    <header className="course__course-runs-header">
      <strong>
        <FormattedMessage {...messages.start} />
      </strong>
      <strong>
        <FormattedMessage {...messages.end} />
      </strong>
    </header>
    {children}
  </section>
);

export default CourseRunSection;
