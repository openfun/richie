import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { SaleTunnelStepResume } from '.';

describe('SaleTunnelStepResume', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a success message and a CTA to start the course', () => {
    const mockNext = jest.fn();

    render(
      <IntlProvider locale="en">
        <SaleTunnelStepResume next={mockNext} />
      </IntlProvider>,
    );

    const successLogo = screen.getByRole('img');
    expect(successLogo).toBeInstanceOf(SVGElement);

    screen.getByRole('heading', { level: 3, name: 'Congratulations!' });

    // Click on the button trigger the next function
    const button = screen.getByRole('button', { name: 'Start this course now!' });
    fireEvent.click(button);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
