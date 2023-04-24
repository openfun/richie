import { rest } from 'msw';
import type { CourseRun } from 'types/Joanie';
import { getAPIEndpoint } from 'api/joanie';
import { CourseFactory } from 'utils/test/factories/joanie';
import { Nullable } from 'types/utils';
import { CourseState } from 'types';
import { Resource } from 'types/Resource';
import { OrganizationMock } from './organizations';

export interface CourseListItemMock extends Resource {
  id: string;
  title: string;
  code: string;
  organization: OrganizationMock;
  course_runs: CourseRun['id'][];
  cover: Nullable<{
    filename: string;
    url: string;
    height: number;
    width: number;
  }>;
  state: CourseState;
}

export const listCourses = rest.get<CourseListItemMock[]>(
  `${getAPIEndpoint()}/courses/`,
  (req, res, ctx) => {
    const queryPerPage = req.url.searchParams.get('per_page');
    const perPage = queryPerPage === null ? 6 : parseInt(queryPerPage, 10);

    const organizationCover001 = require('./assets/organization_cover_001.jpg');
    const courseCover001 = require('./assets/course_cover_001.jpg');
    const courses: CourseListItemMock[] = CourseFactory({
      organization: {
        title: 'Awesome university',
        logo: {
          url: organizationCover001.default,
        },
      },
      cover: { url: courseCover001.default },
    }).many(perPage);

    return res(ctx.status(200), ctx.json(courses));
  },
);
