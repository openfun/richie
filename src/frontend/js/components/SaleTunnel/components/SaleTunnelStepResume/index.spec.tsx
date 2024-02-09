import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import {
  CourseLightFactory,
  CredentialOrderFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { SaleTunnelContext } from 'components/SaleTunnel/context';
import { SaleTunnelStepResume } from '.';

describe('SaleTunnelStepResume', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a success message and a CTA to start the course for a product without contract definition', () => {
    const mockNext = jest.fn();
    const product = ProductFactory().one();
    product.contract_definition = undefined;

    render(
      <IntlProvider locale="en">
        <SaleTunnelContext.Provider
          value={{
            product,
            course: CourseLightFactory({ code: '00000' }).one(),
            key: `00000+${product.id}`,
          }}
        >
          <SaleTunnelStepResume next={mockNext} />
        </SaleTunnelContext.Provider>
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

  it('shows a success message and a CTA to sign the order for a product with a contract definition', () => {
    const mockNext = jest.fn();
    const product = ProductFactory().one();
    const order = CredentialOrderFactory().one();

    render(
      <IntlProvider locale="en">
        <SaleTunnelContext.Provider
          value={{
            product,
            order,
            course: CourseLightFactory({ code: '00000' }).one(),
            key: `00000+${product.id}`,
          }}
        >
          <SaleTunnelStepResume next={mockNext} />
        </SaleTunnelContext.Provider>
      </IntlProvider>,
    );

    const successLogo = screen.getByRole('img');
    expect(successLogo).toBeInstanceOf(SVGElement);

    screen.getByRole('heading', { level: 3, name: 'Congratulations!' });
    screen.getByText(
      /In order to enroll to course runs you first need to sign the training contract/,
    );

    // Click on the button trigger the next function
    const button = screen.getByRole('link', { name: 'Sign the training contract' });
    expect(button).toHaveAttribute('href', `/en/dashboard/courses/orders/${order.id}`);
    fireEvent.click(button);
    expect(mockNext).toHaveBeenCalledTimes(0);
  });
});
