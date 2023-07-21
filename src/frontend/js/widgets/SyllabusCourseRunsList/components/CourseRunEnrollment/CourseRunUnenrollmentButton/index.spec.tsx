import { act, fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { CourseRunUnenrollButton } from 'widgets/SyllabusCourseRunsList/components/CourseRunEnrollment/CourseRunUnenrollmentButton/index';

describe('CourseRunUnenrollmentButton', () => {
  it('renders a CourseRunUnenrollButton', async () => {
    const unenroll = jest.fn();
    render(
      <IntlProvider locale="en">
        <CourseRunUnenrollButton onUnenroll={unenroll} />
      </IntlProvider>,
    );

    const button = await screen.findByRole('button', { name: 'Unenroll from this course' });
    await act(() => {
      fireEvent.click(button);
    });

    expect(unenroll).toHaveBeenCalledTimes(1);
  });
});
