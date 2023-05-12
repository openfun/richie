import { IntlShape } from 'react-intl';

export const getCourseUrl = (courseCode: string, intl: IntlShape) => {
  return `/${intl.locale.split('-')[0]}/courses/${courseCode}`;
};
