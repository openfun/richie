import { screen } from '@testing-library/react';

export const expectUrlMatchLocationDisplayed = (url: string) => {
  screen.getByTestId('location-display-' + url);
};
