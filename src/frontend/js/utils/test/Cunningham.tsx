import { screen } from '@testing-library/react';

export const expectMenuToBeOpen = (menu: HTMLDivElement) => {
  expect(Array.from(menu.classList)).toContain('c__select__menu--opened');
};
export const expectOptions = (expectedOptions: string[]) => {
  const options = screen.getAllByRole('option');
  expect(options.length).toBe(expectedOptions.length);
  options.forEach((option, i) => {
    expect(option).toHaveTextContent(expectedOptions[i]);
  });
};
export const expectNoOptions = () => {
  const options = screen.getAllByRole('listitem');
  expect(options.length).toBe(1);
  expect(options[0]).toHaveTextContent('No options available');
};
export const expectMenuToBeClosed = (menu: HTMLDivElement) => {
  expect(Array.from(menu.classList)).not.toContain('c__select__menu--opened');
};
export const expectOptionToBeSelected = (option: HTMLLIElement) => {
  expect(Array.from(option.classList)).toContain('c__select__menu__item--selected');
};
export const expectOptionToBeUnselected = (option: HTMLLIElement) => {
  expect(option).toHaveAttribute('aria-selected', 'false');
  expect(Array.from(option.classList)).not.toContain('c__select__menu__item--selected');
};
export const expectOptionToBeDisabled = (option: HTMLLIElement) => {
  expect(option).toHaveAttribute('aria-disabled');
  expect(Array.from(option.classList)).toContain('c__select__menu__item--disabled');
};
