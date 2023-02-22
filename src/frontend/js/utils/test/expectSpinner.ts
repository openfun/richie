import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';

export const expectSpinner = async (name?: string) => {
  await waitFor(() => {
    screen.getByRole('status', { name });
  });
};

export const expectNoSpinner = async (name?: string) => {
  await waitForElementToBeRemoved(() => {
    return screen.getByRole('status', { name });
  });
};
