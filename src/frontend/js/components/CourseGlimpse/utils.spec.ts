import { createIntl } from 'react-intl';
import {
  CourseListItemFactory,
  OfferingFactory,
  OrganizationFactory,
} from 'utils/test/factories/joanie';
import { getCourseGlimpseProps } from './utils';

describe('getCourseGlimpseProps', () => {
  const intl = createIntl({ locale: 'en' });
  const [firstOrganization, selectedOrganization] = OrganizationFactory().many(2);

  it('shows the selected organization for a course managed by several organizations', () => {
    const course = CourseListItemFactory({
      organizations: [firstOrganization, selectedOrganization],
    }).one();
    const props = getCourseGlimpseProps(course, intl, selectedOrganization.id);
    expect(props.organization.title).toEqual(selectedOrganization.title);
  });

  it('shows the selected organization for an offering managed by several organizations', () => {
    const offering = OfferingFactory({
      organizations: [firstOrganization, selectedOrganization],
    }).one();
    const props = getCourseGlimpseProps(offering, intl, selectedOrganization.id);
    expect(props.organization.title).toEqual(selectedOrganization.title);
  });

  it('falls back to the first organization when none is selected', () => {
    const course = CourseListItemFactory({
      organizations: [firstOrganization, selectedOrganization],
    }).one();
    expect(getCourseGlimpseProps(course, intl).organization.title).toEqual(firstOrganization.title);
  });
});
