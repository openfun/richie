import { screen } from '@testing-library/react';

export const expectBreadcrumbsToEqualParts = (parts: string[]) => {
  const element = screen.getByTestId('dashboard-breadcrumbs');
  const actualBreadcrumbs = Array.from(element.querySelectorAll('li')).map((listElement) => {
    return listElement.textContent;
  });
  expect(actualBreadcrumbs).toEqual(parts);
};
