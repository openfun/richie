import { screen, within } from '@testing-library/react';

export const expectBreadcrumbsToEqualParts = (parts: string[]) => {
  const breadcrumb = screen.getByTestId('dashboard-breadcrumbs');
  const breadcrumbParts = within(breadcrumb).getAllByRole('link');
  const breadcrumbTextContents = breadcrumbParts.map((node) => node.textContent);
  expect(breadcrumbTextContents).toEqual(parts);
};
