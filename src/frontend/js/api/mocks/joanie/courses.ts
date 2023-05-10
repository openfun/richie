import { rest } from 'msw';
import type { CourseRun } from 'types/Joanie';
import { getAPIEndpoint } from 'api/joanie';
import {
  CourseFactory,
  CourseListItemFactory,
  CourseRunFactory,
} from 'utils/test/factories/joanie';
import { Nullable } from 'types/utils';
import { CourseState } from 'types';
import { Product } from 'types/Joanie';
import { Resource } from 'types/Resource';
import { CourseStateFutureOpenFactory } from 'utils/test/factories/richie';
import { OrganizationMock } from './organizations';

export interface CourseListItemMock extends Resource {
  id: string;
  title: string;
  code: string;
  course_runs: CourseRun['id'][];
  organizations: OrganizationMock[];
  cover: Nullable<{
    filename: string;
    url: string;
    height: number;
    width: number;
  }>;
  state: CourseState;
}

export interface CourseMock {
  id: string;
  code: string;
  title: string;
  cover: Nullable<{
    filename: string;
    url: string;
    height: number;
    width: number;
  }>;
  organizations: OrganizationMock[];
  selling_organizations: OrganizationMock[];
  products: Product[];
  course_runs: CourseRun[];
  state: CourseState;
}

export const listCourses = rest.get<CourseListItemMock[]>(
  `${getAPIEndpoint()}/courses/`,
  (req, res, ctx) => {
    const queryPerPage = req.url.searchParams.get('per_page');
    const perPage = queryPerPage === null ? 6 : parseInt(queryPerPage, 10);

    const organizationCover001 = require('./assets/organization_cover_001.jpg');
    const courseCover001 = require('./assets/course_cover_001.jpg');
    const courses: CourseListItemMock[] = CourseListItemFactory({
      organizations: [
        {
          title: 'Awesome university',
          logo: {
            url: organizationCover001.default,
          },
        },
      ],
      cover: { url: courseCover001.default },
    }).many(perPage);

    return res(ctx.status(200), ctx.json(courses));
  },
);

export const getCourse = rest.get<Nullable<CourseMock>>(
  `${getAPIEndpoint()}/courses/:courseCode/`,
  (req, res, ctx) => {
    const courseCover001 = require('./assets/course_cover_001.jpg');
    const courseCode = req.params.courseCode as string;
    const course: CourseMock = CourseFactory({
      code: courseCode,
      cover: { url: courseCover001.default },
      course_runs: [
        ...CourseRunFactory().many(2),
        CourseRunFactory({
          state: CourseStateFutureOpenFactory().one(),
        }).one(),
      ],
    }).one();
    return res(ctx.status(200), ctx.json(course));
  },
);
