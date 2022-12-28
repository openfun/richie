import { waitFor } from '@testing-library/react';

export const expectSpinner = async () => {
  await waitFor(() => {
    const loader = document!.querySelector('.spinner') as HTMLElement;
    expect(loader).not.toBeNull();
  });
};
