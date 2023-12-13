import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import OrganizationLinks from '.';

describe('OrganizationLinks', () => {
  it('should render successfully organization with logo', () => {
    const organization = OrganizationFactory({ title: 'Organization 1' }).one();

    render(
      <IntlProvider locale="en">
        <MemoryRouter>
          <OrganizationLinks organizations={[organization]} />
        </MemoryRouter>
      </IntlProvider>,
    );

    // A link to the organization should be rendered
    const link = screen.getByRole('link', { name: 'Organization 1' });
    expect(link).toHaveAttribute('href', `/teacher/organizations/${organization.id}/courses`);

    // The link should contain the organization logo
    const img = link.querySelector('img');
    expect(img).toHaveAttribute('alt', organization.title);
    expect(img).toHaveAttribute('src', organization.logo?.src);
    expect(img).toHaveAttribute('srcset', organization.logo?.srcset);

    // And not the abbreviation
    const abbr = link.querySelector('span');
    expect(abbr).toBeNull();
  });

  it('should render successfully organization with abbr', () => {
    const organization = OrganizationFactory({ title: 'Organization 1', logo: null }).one();

    render(
      <IntlProvider locale="en">
        <MemoryRouter>
          <OrganizationLinks organizations={[organization]} />
        </MemoryRouter>
      </IntlProvider>,
    );

    // A link to the organization should be rendered
    const link = screen.getByRole('link', { name: 'Organization 1' });
    expect(link).toHaveAttribute('href', `/teacher/organizations/${organization.id}/courses`);

    // The link should contain the organization abbreviation
    const abbr = link.querySelector('span');
    expect(abbr).toHaveTextContent('O1');

    // And not the logo
    const img = link.querySelector('img');
    expect(img).toBeNull();
  });
});
