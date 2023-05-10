import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';

import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { CourseListItemFactory } from 'utils/test/factories/joanie';
import { CourseListItemMock as Course } from 'api/mocks/joanie/courses';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { TeacherCoursesDashboardLoader } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('components/TeacherCoursesDashboardLoader', () => {
  let nbApiCalls: number;
  beforeEach(() => {
    // Joanie providers calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    // teacher course sidebar calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);

    nbApiCalls = 4;
  });

  it('do render', async () => {
    const courseIncoming: Course = CourseListItemFactory({ title: 'Incoming leason' }).one();
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/courses/?per_page=3&status=incoming&type=all',
      [courseIncoming],
      {
        repeat: 1,
      },
    );
    const courseOngoing: Course = CourseListItemFactory({ title: 'Ongoing leason' }).one();
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/courses/?per_page=3&status=ongoing&type=all',
      [courseOngoing],
      {
        repeat: 1,
        overwriteRoutes: false,
      },
    );
    const courseAchived: Course = CourseListItemFactory({ title: 'Archived leason' }).one();
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/courses/?per_page=3&status=archived&type=all',
      [courseAchived],
      {
        repeat: 1,
        overwriteRoutes: false,
      },
    );

    const user = UserFactory().one();
    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <JoanieSessionProvider>
            <RouterProvider
              router={createMemoryRouter([
                {
                  path: '',
                  element: <TeacherCoursesDashboardLoader />,
                },
              ])}
            />
          </JoanieSessionProvider>
        </QueryClientProvider>
      </IntlProvider>,
    );
    await expectNoSpinner('Loading courses ...');

    nbApiCalls += 1; // incoming courses api call
    nbApiCalls += 1; // ongoing courses api call
    nbApiCalls += 1; // archived courses api call
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls);
    expect(calledUrls).toContain(
      'https://joanie.endpoint/api/v1.0/courses/?per_page=3&status=incoming&type=all',
    );
    expect(calledUrls).toContain(
      'https://joanie.endpoint/api/v1.0/courses/?per_page=3&status=ongoing&type=all',
    );
    expect(calledUrls).toContain(
      'https://joanie.endpoint/api/v1.0/courses/?per_page=3&status=archived&type=all',
    );

    expect(screen.getByDisplayValue('Status: All')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Training type: All')).toBeInTheDocument();

    // section titles
    expect(
      await screen.getByRole('heading', {
        name: 'Incoming',
      }),
    ).toBeInTheDocument();
    expect(
      await screen.getByRole('heading', {
        name: 'Ongoing',
      }),
    ).toBeInTheDocument();
    expect(
      await screen.getByRole('heading', {
        name: 'Archived',
      }),
    ).toBeInTheDocument();

    // Leason titles
    expect(
      await screen.getByRole('heading', {
        name: /Incoming/,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.getByRole('heading', {
        name: /Ongoing/,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.getByRole('heading', {
        name: /Archived/,
      }),
    ).toBeInTheDocument();
  });
});
