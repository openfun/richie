import { screen, waitFor } from '@testing-library/react';

export const expectSpinner = async (name?: string) => {
  await waitFor(() => {
    screen.getByRole('status', { name });
  });
};

export const expectNoSpinner = async (name?: string) => {
  await waitFor(() => {
    expect(screen.queryByRole('status', { name })).toBeNull();
  });
};
