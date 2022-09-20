import { render, screen } from '@testing-library/react';
import { Button } from '.';

describe('<Button />', () => {
  it('renders a button', () => {
    render(<Button color="primary">Click me</Button>);

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button).toBeEnabled();
  });

  it('renders a link', () => {
    render(
      <Button color="primary" href="https://www.fun-mooc.fr/">
        Click me
      </Button>,
    );

    const button = screen.getByRole('link', { name: 'Click me' });
    expect(button).toBeInstanceOf(HTMLAnchorElement);
    expect(button).toBeEnabled();
  });

  it('renders a disabled button', () => {
    render(
      <Button color="primary" disabled={true}>
        Click me
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button).toBeDisabled();
  });
});
