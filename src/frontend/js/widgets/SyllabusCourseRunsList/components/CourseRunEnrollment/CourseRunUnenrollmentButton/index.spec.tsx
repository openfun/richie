import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { render } from 'utils/test/render';
import { CourseRunUnenrollButton } from 'widgets/SyllabusCourseRunsList/components/CourseRunEnrollment/CourseRunUnenrollmentButton/index';

describe('CourseRunUnenrollmentButton', () => {
  it('renders a CourseRunUnenrollButton', async () => {
    const unenroll = jest.fn();
    render(
      <IntlProvider locale="en">
        <CourseRunUnenrollButton onUnenroll={unenroll} />
      </IntlProvider>,
      { wrapper: null },
    );

    const button = await screen.findByRole('button', { name: 'Unenroll from this course' });
    const user = userEvent.setup();
    await user.click(button);

    expect(unenroll).toHaveBeenCalledTimes(1);
  });
});
