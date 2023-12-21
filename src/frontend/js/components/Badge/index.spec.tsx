import { render, screen } from '@testing-library/react';
import Badge from '.';

describe('Badge', () => {
  it('should render', () => {
    render(<Badge>999</Badge>);

    screen.getByText('999');
  });

  it('should be possible to set color', () => {
    render(<Badge color="primary">999</Badge>);

    const badge = screen.getByText('999');
    expect(badge.parentElement).toHaveClass('category-badge--primary');
  });
});
