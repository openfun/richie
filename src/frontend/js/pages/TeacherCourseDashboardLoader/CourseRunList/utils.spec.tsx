import { IntlProvider, createIntl } from 'react-intl';
import { render, screen } from '@testing-library/react';
import { capitalize } from 'lodash-es';
import { NavigateFunction, To } from 'react-router-dom';
import { CourseRunFactory } from 'utils/test/factories/joanie';
import { CourseMock } from 'api/mocks/joanie/courses';
import { buildCourseRunData, messages } from './utils';

describe('pages/TeacherCourseDashboardLoader/CourseRunList/buildCourseRunData', () => {
  const navigate: NavigateFunction = (to: To | number) => { }; // eslint-disable-line
  const courseCode: CourseMock['code'] = 'akeuj';
  it('should return the right keys', () => {
    const courseRunList = CourseRunFactory().many(1);
    const intl = createIntl({ locale: 'en' });
    const listData = buildCourseRunData(intl, navigate, courseCode, courseRunList);
    expect(listData.length).toBe(1);

    const listItem = listData[0];
    expect(Object.keys(listItem).sort()).toEqual(['action', 'id', 'period', 'status', 'title']);
  });
  it('should contain a valid title', () => {
    const courseRun = CourseRunFactory().one();
    const intl = createIntl({ locale: 'en' });
    const listItem = buildCourseRunData(intl, navigate, courseCode, [courseRun])[0];

    render(listItem.title);
    expect(screen.getByText(capitalize(courseRun.title), { exact: false })).toBeInTheDocument();
    expect(screen.getByTitle(capitalize(courseRun.title))).toBeInTheDocument();
  });
  it('should contain a valid period', () => {
    const courseRun = CourseRunFactory().one();
    const intl = createIntl({ locale: 'en' });
    const listItem = buildCourseRunData(intl, navigate, courseCode, [courseRun])[0];

    render(listItem.period);
    expect(
      screen.getByText(intl.formatDate(new Date(courseRun.start)), { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(intl.formatDate(new Date(courseRun.end)), { exact: false }),
    ).toBeInTheDocument();
  });
  it('should contain a valid status', () => {
    const courseRun = CourseRunFactory().one();
    const intl = createIntl({ locale: 'en' });
    const listItem = buildCourseRunData(intl, navigate, courseCode, [courseRun])[0];

    render(listItem.status);
    expect(screen.getByText(courseRun.state.text, { exact: false })).toBeInTheDocument();
  });
  it('should contain a valid action', () => {
    const courseRun = CourseRunFactory().one();
    const intl = createIntl({ locale: 'en' });
    const listItem = buildCourseRunData(intl, navigate, courseCode, [courseRun])[0];

    render(<IntlProvider locale="en">{listItem.action}</IntlProvider>);
    expect(
      screen.getByRole('button', { name: intl.formatMessage(messages.dataCourseRunLink) }),
    ).toBeInTheDocument();
  });
});
