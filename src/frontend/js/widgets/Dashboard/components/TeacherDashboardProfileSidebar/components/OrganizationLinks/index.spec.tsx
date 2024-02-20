import { screen } from '@testing-library/react';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import { render } from 'utils/test/render';
import { PresentationalAppWrapper } from 'utils/test/wrappers/PresentationalAppWrapper';
import OrganizationLinks from '.';

describe('OrganizationLinks', () => {
  it('should render successfully organization with logo', () => {
    const organization = OrganizationFactory({ title: 'Organization 1' }).one();

    render(<OrganizationLinks organizations={[organization]} />, {
      wrapper: PresentationalAppWrapper,
    });

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

    render(<OrganizationLinks organizations={[organization]} />, {
      wrapper: PresentationalAppWrapper,
    });

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
