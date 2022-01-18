import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { CommonDataProps } from 'types/commonDataProps';
import { ContextFactory } from 'utils/test/factories';

import { CourseGlimpse } from '.';

describe('components/CourseGlimpse', () => {
  const course = {
    absolute_url: 'https://example/com/courses/42/',
    categories: ['24', '42'],
    code: '123abc',
    cover_image: {
      sizes: '330px',
      src: '/thumbs/small.png',
      srcset: 'some srcset',
    },
    duration: '3 months',
    effort: '3 hours',
    icon: null,
    id: '742',
    organization_highlighted: 'Some Organization',
    organization_highlighted_cover_image: {
      sizes: '330px',
      src: '/thumbs/org_small.png',
      srcset: 'some srcset',
    },
    organizations: ['36', '63'],
    state: {
      call_to_action: 'Enroll now',
      datetime: '2019-03-14T10:35:47.823Z',
      priority: 0,
      text: 'starts on',
    },
    title: 'Course 42',
  };

  const contextProps: CommonDataProps['context'] = ContextFactory().generate();

  it('renders a course glimpse with its data', () => {
    const { container } = render(
      <IntlProvider locale="en">
        <CourseGlimpse
          context={contextProps}
          course={{
            ...course,
            duration: '3 months',
            effort: '3 hours',
          }}
        />
      </IntlProvider>,
    );

    // The link that wraps the course glimpse should have no title as its content is explicit enough
    expect(screen.getByRole('link')).not.toHaveAttribute('title');
    // The course glimpse shows the relevant information
    screen.getByRole('heading', { name: 'Course 42', level: 3 });
    screen.getByText('123abc');
    screen.getByText('Some Organization');
    // Matches on 'Starts on Mar 14, 2019', date is wrapped with intl <span>
    screen.getByText('Starts on Mar 14, 2019');

    // Check course logo
    const courseGlipseMedia = container.getElementsByClassName('course-glimpse__media');
    expect(courseGlipseMedia.length).toBe(1);
    const img = courseGlipseMedia[0].firstChild;
    expect(img).toBeInstanceOf(HTMLImageElement);
    // The logo is rendered along with alt text "" as it is decorative and included in a link block
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('src', '/thumbs/small.png');

    // Check organization logo
    const orgLogoElement = container.getElementsByClassName('course-glimpse__organization-logo');
    expect(orgLogoElement.length).toBe(1);
    const orgImg = orgLogoElement[0].firstChild;
    expect(orgImg).toBeInstanceOf(HTMLImageElement);
    // The logo is rendered along with alt text "" as it is decorative and included in a link block
    expect(orgImg).toHaveAttribute('alt', '');
    expect(orgImg).toHaveAttribute('src', '/thumbs/org_small.png');
  });

  it('works when there is no call to action or datetime on the state (eg. an archived course)', () => {
    render(
      <IntlProvider locale="en">
        <CourseGlimpse
          context={contextProps}
          course={{
            ...course,
            state: {
              ...course.state,
              call_to_action: null,
              datetime: null,
              text: 'archived',
            },
          }}
        />
      </IntlProvider>,
    );

    // Make sure the component renders and shows the state
    screen.getByRole('heading', { name: 'Course 42', level: 3 });
    screen.getByText('Archived');
  });

  it('shows the "Cover" placeholder div when the course is missing a cover image', () => {
    render(
      <IntlProvider locale="en">
        <CourseGlimpse context={contextProps} course={{ ...course, cover_image: null }} />
      </IntlProvider>,
    );

    screen.getByRole('heading', { name: 'Course 42', level: 3 });
    screen.getByText('Cover');
  });

  it('does include "-" if the course code is not set', () => {
    render(
      <IntlProvider locale="en">
        <CourseGlimpse context={contextProps} course={{ ...course, code: null }} />
      </IntlProvider>,
    );

    expect(screen.getByText('-').parentElement).toHaveClass(
      'course-glimpse__metadata',
      'course-glimpse__metadata--code',
    );
  });
});
