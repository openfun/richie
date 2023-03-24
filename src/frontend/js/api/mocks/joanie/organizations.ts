import { rest } from 'msw';
import { getAPIEndpoint } from 'api/joanie';

export interface OrganizationMock {
  id: string;
  code: string;
  title: string;
  logo: {
    filename: string;
    url: string;
    height: number;
    width: number;
  };
}

export const listOrganizations = rest.get<OrganizationMock[]>(
  `${getAPIEndpoint()}/organizations`,
  (_req, res, ctx) => {
    const cover001 = require('./assets/organization_cover_001.jpg');
    const cover002 = require('./assets/organization_cover_002.jpg');
    const organisations: OrganizationMock[] = [
      {
        id: 'AAA',
        code: 'code__AAA',
        title: 'Univesité de Rennes',
        logo: {
          filename: 'organization_cover_001.jpg',
          url: cover001.default,
          height: 113,
          width: 113,
        },
      },
      {
        id: 'BBB',
        code: 'code__BBB',
        title: 'Univesité de Paris',
        logo: {
          filename: 'organization_cover_002.jpg',
          url: cover002.default,
          height: 113,
          width: 113,
        },
      },
    ];
    return res(ctx.status(200), ctx.json(organisations));
  },
);
