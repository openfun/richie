import path from 'path';
import fs from 'fs';
import { render, screen } from '@testing-library/react';

import { Icon, IconTypeEnum } from '.';

const commonTests = ($svg: SVGSVGElement | null) => {
  expect($svg).not.toBeNull();
  expect($svg?.classList.contains('icon')).toEqual(true);
  expect($svg?.querySelector('use')).toHaveAttribute('href', '#icon-barcode');
};

describe('components/Icon', () => {
  it('renders a decorative icon', () => {
    const { container } = render(<Icon name={IconTypeEnum.BARCODE} />);

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
    const { container } = render(<Icon name={IconTypeEnum.BARCODE} title="Code" />);

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
    const { container } = render(
      <Icon name={IconTypeEnum.BARCODE} title="Code" className="test" />,
    );
    const $svg = container.querySelector('svg');
    expect($svg).not.toBeNull();
    expect($svg?.classList.contains('icon')).toEqual(true);
    expect($svg?.classList.contains('test')).toEqual(true);
  });
});

describe('IconTypeEnum', () => {
  it('has no missing symbols', () => {
    const iconsPath = path.join(
      __dirname,
      '../../../../richie/apps/core/templates/richie/icons.html',
    );
    const iconRawHtml = fs.readFileSync(iconsPath, 'utf8');
    const symbolIdRegexp = /id="(icon-[a-z-]+)"/g;
    const IconTypes: string[] = Object.values(IconTypeEnum);
    let match;
    // eslint-disable-next-line no-cond-assign
    while ((match = symbolIdRegexp.exec(iconRawHtml)) !== null) {
      // Uncomment the following line to known which icon is missing in the IconTypeEnum
      // console.log(match[1]);
      expect(IconTypes.includes(match[1])).toBe(true);
    }
  });

  it('has no unknown symbols', () => {
    const iconsPath = path.join(
      __dirname,
      '../../../../richie/apps/core/templates/richie/icons.html',
    );
    const iconRawHtml = fs.readFileSync(iconsPath, 'utf8');
    const IconTypes: string[] = Object.values(IconTypeEnum);

    IconTypes.forEach((iconType) => {
      // Uncomment the following line to known which icon does not exist in the icons.html file
      // console.log(iconType);
      expect(iconRawHtml).toMatch(`id=\"${iconType}\"`);
    });
  });
});
