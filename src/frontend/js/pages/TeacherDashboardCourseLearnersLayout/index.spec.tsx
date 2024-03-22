import fetchMock from 'fetch-mock';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import queryString from 'query-string';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  CourseProductRelationFactory,
  NestedCourseOrderFactory,
  OrganizationFactory,
} from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { PER_PAGE } from 'settings';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { expectBannerError } from 'utils/test/expectBanner';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { TeacherDashboardCourseLearnersLayout } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('pages/TeacherDashboardCourseLearnersLayout', () => {
  setupJoanieSession();
  beforeEach(() => {
    // CourseSidebar api calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/courses/', {});
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);
  });

  it.each([
    {
      expectedLabel: 'should not render organization filter without organizations',
      nbOrganization: 0,
      organizationFilterShouldBeDisplayed: false,
    },
    {
      expectedLabel: 'should not render organization filter with 1 organization',
      nbOrganization: 1,
      organizationFilterShouldBeDisplayed: false,
    },
    {
      expectedLabel: 'should render organization filter with 2 organization',
      nbOrganization: 2,
      organizationFilterShouldBeDisplayed: true,
    },
  ])('$expectedLabel', async ({ nbOrganization, organizationFilterShouldBeDisplayed }) => {
    const courseProductRelation = CourseProductRelationFactory().one();
    const organizationList = OrganizationFactory().many(nbOrganization);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/?course_product_relation_id=${courseProductRelation.id}`,
      organizationList,
    );

    // Course sidebar query
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/course-product-relations/${courseProductRelation.id}/`,
      {},
    );

    // First request before finding default organizationId
    const courseOrderListQueryParams = {
      course_product_relation_id: courseProductRelation.id,
      page: 1,
      page_size: PER_PAGE.courseLearnerList,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify(courseOrderListQueryParams, { sort: false })}`,
      [],
    );

    if (organizationList.length > 0) {
      // Course sidebar query
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/organizations/${organizationList[0].id}/contracts/?course_product_relation_id=${courseProductRelation.id}&signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
        [],
      );

      // Second request when default organizationId is fetched
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify({ organization_id: organizationList[0].id, ...courseOrderListQueryParams }, { sort: false })}`,
        [],
      );
    }
    render(<TeacherDashboardCourseLearnersLayout />, {
      routerOptions: {
        path: '/:courseId/:courseProductRelationId',
        initialEntries: [`/${courseProductRelation.course.id}/${courseProductRelation.id}`],
      },
    });

    await expectNoSpinner();
    if (organizationFilterShouldBeDisplayed) {
      expect(
        await screen.findByRole('combobox', {
          name: /Organization/,
          hidden: true,
        }),
      ).toBeInTheDocument();
    } else {
      expect(
        screen.queryByRole('combobox', {
          name: /Organization/,
          hidden: true,
        }),
      ).not.toBeInTheDocument();
    }
  });

  it('should call onFiltersChange on organization filter change', async () => {
    const courseProductRelation = CourseProductRelationFactory().one();
    const defaultOrganization = OrganizationFactory().one();
    const otherOrganization = OrganizationFactory().one();
    const organizationList = [defaultOrganization, otherOrganization];

    // Course sidebar queries
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${defaultOrganization.id}/contracts/?course_product_relation_id=${courseProductRelation.id}&signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
      [],
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/course-product-relations/${courseProductRelation.id}/`,
      {},
    );

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/?course_product_relation_id=${courseProductRelation.id}`,
      organizationList,
    );
    // First request before finding default organizationId
    const courseOrderListQueryParams = {
      course_product_relation_id: courseProductRelation.id,
      page: 1,
      page_size: PER_PAGE.courseLearnerList,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify(courseOrderListQueryParams, { sort: false })}`,
      [],
    );
    // Second request when default organizationId is fetched
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify({ organization_id: defaultOrganization.id, ...courseOrderListQueryParams }, { sort: false })}`,
      [],
    );

    render(<TeacherDashboardCourseLearnersLayout />, {
      routerOptions: {
        path: '/:courseId/:courseProductRelationId',
        initialEntries: [`/${courseProductRelation.course.id}/${courseProductRelation.id}`],
      },
    });

    const organizationFilter: HTMLInputElement = await screen.findByRole('combobox', {
      name: 'Organization',
      hidden: true,
    });

    const user = userEvent.setup();
    await user.click(organizationFilter);
    const optionToSelect = screen.getByRole('option', { name: organizationList[1].title });

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify({ organization_id: otherOrganization.id, ...courseOrderListQueryParams }, { sort: false })}`,
      [],
    );
    await user.click(optionToSelect);
    // onload default value is undefine and is onFiltersChange called once
    expect(
      fetchMock.called(
        `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify({ organization_id: otherOrganization.id, ...courseOrderListQueryParams }, { sort: false })}`,
      ),
    ).toBe(true);
  });

  it('should render a list of course learners for a course product relation', async () => {
    const defaultOrganization = OrganizationFactory().one();
    const otherOrganization = OrganizationFactory().one();
    const organizationList = [defaultOrganization, otherOrganization];
    const courseProductRelation = CourseProductRelationFactory().one();
    const courseOrderList = NestedCourseOrderFactory().many(3);

    // Course sidebar queries
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${defaultOrganization.id}/contracts/?course_product_relation_id=${courseProductRelation.id}&signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
      [],
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/course-product-relations/${courseProductRelation.id}/`,
      {},
    );

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/?course_product_relation_id=${courseProductRelation.id}`,
      organizationList,
    );

    // First request before finding default organizationId
    const courseOrderListQueryParams = {
      course_product_relation_id: courseProductRelation.id,
      page: 1,
      page_size: PER_PAGE.courseLearnerList,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify(courseOrderListQueryParams, { sort: false })}`,
      courseOrderList,
    );
    // Second request when default organizationId is fetched
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify({ organization_id: defaultOrganization.id, ...courseOrderListQueryParams }, { sort: false })}`,
      courseOrderList,
    );

    render(<TeacherDashboardCourseLearnersLayout />, {
      routerOptions: {
        path: '/:courseId/:courseProductRelationId',
        initialEntries: [`/${courseProductRelation.course.id}/${courseProductRelation.id}`],
      },
    });

    await expectNoSpinner();

    // Organization filter should have been rendered
    const organizationFilter: HTMLInputElement = await screen.findByRole('combobox', {
      name: 'Organization',
    });
    expect(organizationFilter).toHaveAttribute('value', '');

    expect(screen.getByRole('table')).toBeInTheDocument();
    // Table body should have been rendered with 3 rows (one per courseOrder)
    // Table content is tested in CourseLearnerDataGrid
    courseOrderList.forEach((courseOrder) => {
      expect(screen.getByTestId(courseOrder.id)).toBeInTheDocument();
    });
  });

  it('should render a list of course learners for an organization', async () => {
    const organization = OrganizationFactory().one();
    const courseProductRelation = CourseProductRelationFactory().one();
    const courseOrderList = NestedCourseOrderFactory().many(3);

    // Course sidebar queries
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/contracts/?course_product_relation_id=${courseProductRelation.id}&signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
      [],
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/course-product-relations/${courseProductRelation.id}/`,
      {},
    );

    // before default organization's fetched, we query all organization to decide if we should display organization filter or not.
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/?course_product_relation_id=${courseProductRelation.id}`,
      [organization],
    );

    const courseOrderListQueryParams = {
      organization_id: organization.id,
      course_product_relation_id: courseProductRelation.id,
      page: 1,
      page_size: PER_PAGE.courseLearnerList,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify(courseOrderListQueryParams, { sort: false })}`,
      courseOrderList,
    );

    render(<TeacherDashboardCourseLearnersLayout />, {
      routerOptions: {
        path: '/:organizationId/:courseId/:courseProductRelationId',
        initialEntries: [
          `/${organization.id}/${courseProductRelation.course.id}/${courseProductRelation.id}`,
        ],
      },
    });

    await expectNoSpinner();

    // Organization filter should not have been rendered
    const organizationFilter = screen.queryByRole('combobox', { name: 'Organization' });
    expect(organizationFilter).not.toBeInTheDocument();

    expect(screen.getByRole('table')).toBeInTheDocument();
    // Table body should have been rendered with 3 rows (one per courseOrder)
    // Table content is tested in CourseLearnerDataGrid
    courseOrderList.forEach((courseOrder) => {
      expect(screen.getByTestId(courseOrder.id)).toBeInTheDocument();
    });
  });

  it('should render an empty table if there are no course learners', async () => {
    const organization = OrganizationFactory().one();
    const courseProductRelation = CourseProductRelationFactory().one();

    // Course sidebar queries
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/contracts/?course_product_relation_id=${courseProductRelation.id}&signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
      [],
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/course-product-relations/${courseProductRelation.id}/`,
      {},
    );

    // before default organization's fetched, we query all organization to decide if we should display organization filter or not.
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/?course_product_relation_id=${courseProductRelation.id}`,
      [organization],
    );

    const courseOrderListQueryParams = {
      organization_id: organization.id,
      course_product_relation_id: courseProductRelation.id,
      page: 1,
      page_size: PER_PAGE.courseLearnerList,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify(courseOrderListQueryParams, { sort: false })}`,
      [],
    );

    render(<TeacherDashboardCourseLearnersLayout />, {
      routerOptions: {
        path: '/:organizationId/:courseId/:courseProductRelationId',
        initialEntries: [
          `/${organization.id}/${courseProductRelation.course.id}/${courseProductRelation.id}`,
        ],
      },
    });

    await expectNoSpinner();

    // A message should have been rendered to inform the user that there are no contracts
    screen.getByRole('img', { name: /illustration of an empty table/i });
    screen.getByText(/this table is empty/i);
  });

  it('should render an error banner if an error occured during course learners fetching', async () => {
    const organization = OrganizationFactory().one();
    const courseProductRelation = CourseProductRelationFactory().one();

    // Course sidebar queries
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/contracts/?course_product_relation_id=${courseProductRelation.id}&signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
      [],
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/course-product-relations/${courseProductRelation.id}/`,
      {},
    );

    // before default organization's fetched, we query all organization to decide if we should display organization filter or not.
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/?course_product_relation_id=${courseProductRelation.id}`,
      [organization],
    );

    const courseOrderListQueryParams = {
      organization_id: organization.id,
      course_product_relation_id: courseProductRelation.id,
      page: 1,
      page_size: PER_PAGE.courseLearnerList,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/${courseProductRelation.course.id}/orders/?${queryString.stringify(courseOrderListQueryParams, { sort: false })}`,
      new Response('', { status: HttpStatusCode.NOT_FOUND }),
    );

    render(<TeacherDashboardCourseLearnersLayout />, {
      routerOptions: {
        path: '/:organizationId/:courseId/:courseProductRelationId',
        initialEntries: [
          `/${organization.id}/${courseProductRelation.course.id}/${courseProductRelation.id}`,
        ],
      },
    });

    await expectNoSpinner();
    await expectBannerError('An error occurred while fetching orders. Please retry later.');
  });
});
