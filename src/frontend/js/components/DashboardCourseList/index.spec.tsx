import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';

import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { CourseListItemMock } from 'api/mocks/joanie/courses';
import { CourseFactory } from 'utils/test/factories/joanie';
import { TeacherCourseSearchFilters, CourseTypeFilter, CourseStatusFilter } from 'hooks/useCourses';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import DashboardCourseList from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).generate(),
}));

describe('components/DashboardCourseList', () => {
  let nbApiCalls: number;
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', [], { overwriteRoutes: true });
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', [], { overwriteRoutes: true });
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [], { overwriteRoutes: true });
    nbApiCalls = 3;
  });
  afterEach(() => {
    fetchMock.restore();
  });

  it('do render', async () => {
    CourseFactory.beforeGenerate((shape: CourseListItemMock) => {
      return {
        ...shape,
        title: 'How to cook birds',
      };
    });
    const courseCooking: CourseListItemMock = CourseFactory.generate();

    CourseFactory.beforeGenerate((shape: CourseListItemMock) => {
      return {
        ...shape,
        title: "Let's dance, the online leason",
      };
    });
    const courseDancing: CourseListItemMock = CourseFactory.generate();
    fetchMock.get('https://joanie.endpoint/api/v1.0/courses/?status=all&type=all', [
      courseCooking,
      courseDancing,
    ]);

    const filters: TeacherCourseSearchFilters = {
      status: CourseStatusFilter.ALL,
      type: CourseTypeFilter.ALL,
    };

    const user = UserFactory.generate();
    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <JoanieSessionProvider>
            <MemoryRouter>
              <DashboardCourseList
                titleTranslated="DashboardCourseList test title"
                filters={filters}
              />
            </MemoryRouter>
          </JoanieSessionProvider>
        </QueryClientProvider>
      </IntlProvider>,
    );
    nbApiCalls += 1; // courses api call

    expect(await screen.getByRole('heading', { name: /DashboardCourseList test title/ }));

    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls);
    expect(calledUrls).toContain('https://joanie.endpoint/api/v1.0/courses/?status=all&type=all');

    expect(await screen.findByRole('heading', { name: /How to cook birds/ })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Let's dance, the online leason/ }),
    ).toBeInTheDocument();
  });

  it('do render empty list', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/courses/?status=all&type=all', [], {
      overwriteRoutes: true,
    });

    const filters: TeacherCourseSearchFilters = {
      status: CourseStatusFilter.ALL,
      type: CourseTypeFilter.ALL,
    };

    const user = UserFactory.generate();
    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <JoanieSessionProvider>
            <MemoryRouter>
              <DashboardCourseList
                titleTranslated="DashboardCourseList test title"
                filters={filters}
              />
            </MemoryRouter>
          </JoanieSessionProvider>
        </QueryClientProvider>
      </IntlProvider>,
    );
    nbApiCalls += 1; // courses api call

    expect(await screen.getByRole('heading', { name: /DashboardCourseList test title/ }));

    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls);
    expect(calledUrls).toContain('https://joanie.endpoint/api/v1.0/courses/?status=all&type=all');

    expect(await screen.findByText('You have no courses yet.')).toBeInTheDocument();
  });
});
