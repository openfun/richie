import { screen, waitFor } from '@testing-library/react';

export const expectBreadcrumbsToEqualParts = async (parts: string[]) => {
  await waitFor(() => {
    const element = screen.getByTestId('dashboard-breadcrumbs');
    const actualBreadcrumbs = Array.from(element.querySelectorAll('li')).map((listElement) => {
      return listElement.textContent;
    });
    expect(actualBreadcrumbs).toEqual(parts);
  });
};
