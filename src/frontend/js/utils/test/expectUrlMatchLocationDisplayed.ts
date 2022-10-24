import { screen } from '@testing-library/react';

export const expectUrlMatchLocationDisplayed = (url: string) => {
  // expect(screen.getByTestId('location-display').textContent).toMatch(new RegExp(url + '$'));
  screen.getByTestId('location-display-' + url);
};
