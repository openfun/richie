import { render, screen } from '@testing-library/react';

import { Icon } from '.';

const commonTests = ($svg: SVGSVGElement | null) => {
  expect($svg).not.toBeNull();
  expect($svg?.classList.contains('icon')).toEqual(true);
  expect($svg?.querySelector('use')).toHaveAttribute('href', '#icon-barcode');
};

describe('components/Icon', () => {
  it('renders a decorative icon', () => {
    const { container } = render(<Icon name="icon-barcode" />);

    const $svg = container.querySelector('svg');
    commonTests($svg);

    // a decorative icon must not be seen as an actual image
    expect(screen.queryByRole('img')).toBeNull();

    // we make sure we don't have any labels just in case
    expect($svg?.getAttribute('aria-label')).toBeNull();
    expect($svg?.getAttribute('aria-labelledby')).toBeNull();
    expect($svg?.getAttribute('title')).toBeNull();
  });

  it('renders an informative icon', () => {
    const { container } = render(<Icon name="icon-barcode" title="Code" />);

    const $svg = container.querySelector('svg');
    commonTests($svg);

    // an informative icon must be seen as an image
    screen.getByRole('img');

    // we make sure we have an accessible name (for screen reader users)…
    screen.getByLabelText('Code');
    // … *and* a title (for mouse tooltip)
    screen.getByTitle('Code');
  });

  it('handles custom css classes', () => {
    const { container } = render(<Icon name="icon-barcode" title="Code" className="test" />);
    const $svg = container.querySelector('svg');
    expect($svg).not.toBeNull();
    expect($svg?.classList.contains('icon')).toEqual(true);
    expect($svg?.classList.contains('test')).toEqual(true);
  });
});
