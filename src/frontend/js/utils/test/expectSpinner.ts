import { screen, waitFor } from '@testing-library/react';

export const expectSpinner = async (name?: string) => {
  await waitFor(() => {
    screen.getByRole('status', { name });
  });
};
