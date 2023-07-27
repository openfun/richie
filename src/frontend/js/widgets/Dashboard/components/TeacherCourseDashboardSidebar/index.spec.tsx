import fetchMock from 'fetch-mock';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider, createIntl } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { CourseListItem } from 'types/Joanie';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import {
  TEACHER_DASHBOARD_ROUTE_LABELS,
  TeacherDashboardPaths,
} from 'widgets/Dashboard/utils/teacherRouteMessages';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';

import { CourseFactory } from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { TeacherCourseDashboardSidebar, messages } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

const intl = createIntl({ locale: 'en' });

interface RenderTeacherCourseDashboardSidebarProps {
  courseId: string;
}
const renderTeacherCourseDashboardSidebar = ({
  courseId,
}: RenderTeacherCourseDashboardSidebarProps) =>
  render(
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: UserFactory().one() })}>
        <JoanieSessionProvider>
          <MemoryRouter initialEntries={[`/${courseId}`]}>
            <Routes>
              <Route path="/:courseId" element={<TeacherCourseDashboardSidebar />} />
            </Routes>
          </MemoryRouter>
        </JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );

describe('<TeacherCourseDashboardSidebar/>', () => {
  let nbApiRequest: number;
  beforeEach(() => {
    // JoanieSessionProvider inital requests
    nbApiRequest = 3;
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should display syllabus link', async () => {
    const course: CourseListItem = CourseFactory().one();
    fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.id}/`, course);
    nbApiRequest += 1; // call to course

    renderTeacherCourseDashboardSidebar({ courseId: course.id });
    await expectNoSpinner('Loading course...');
    expect(
      screen.getByRole('link', {
        name: intl.formatMessage(messages.syllabusLinkLabel),
      }),
    ).toBeInTheDocument();
  });

  it('should display menu items', async () => {
    const course: CourseListItem = CourseFactory().one();
    fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.id}/`, course);
    nbApiRequest += 1; // call to course

    renderTeacherCourseDashboardSidebar({ courseId: course.id });
    await expectNoSpinner('Loading course...');
    expect(
      screen.getByRole('link', {
        name: intl.formatMessage(
          TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE_GENERAL_INFORMATION],
        ),
      }),
    ).toBeInTheDocument();

    expect(screen.queryByTestId('organization-links')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2); // 1 menu items + 1 syllabus link
    expect(fetchMock.calls()).toHaveLength(nbApiRequest);
  });
});
