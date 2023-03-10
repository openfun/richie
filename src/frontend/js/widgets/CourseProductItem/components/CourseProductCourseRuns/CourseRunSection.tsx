import { PropsWithChildren } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

export const messages = defineMessages({
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
    {/* the "start" and "end" texts will be repeated on each run offscreen
    so that screen reader users understand correcty, so hide it from them here */}
    <header className="course__course-runs-header" aria-hidden="true">
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
