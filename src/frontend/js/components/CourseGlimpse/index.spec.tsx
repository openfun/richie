import { render, screen } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { CommonDataProps } from 'types/commonDataProps';
import { ContextFactory } from 'utils/test/factories';

import { CourseGlimpse } from '.';

describe('components/CourseGlimpse', () => {
  const course = {
    absolute_url: 'https://example/com/courses/42/',
    categories: ['24', '42'],
    cover_image: {
      sizes: '330px',
      src: '/thumbs/small.png',
      srcset: 'some srcset',
    },
    duration: '3 months',
    effort: '3 hours/week',
    icon: null,
    id: '742',
    organization_highlighted: 'Some Organization',
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
    render(
      <IntlProvider locale="en">
        <CourseGlimpse
          context={contextProps}
          course={{
            ...course,
            duration: '3 months',
            effort: '3 hours/week',
          }}
        />
      </IntlProvider>,
    );

    // The link that wraps the course glimpse should have no title as its content is explicit enough
    expect(screen.getByRole('link')).not.toHaveAttribute('title');
    // The course glimpse shows the relevant information
    screen.getByText('Course 42');
    screen.getByText('Some Organization');
    // Matches on 'Starts on Mar 14, 2019', date is wrapped with intl <span>
    screen.getByText('Starts on Mar 14, 2019');
    // The logo is rendered along with alt text "" as it is decorative and included in a link block
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('src', '/thumbs/small.png');
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
    screen.getByText('Course 42');
    screen.getByText('Archived');
  });

  it('shows the "Cover" placeholder div when the course is missing a cover image', () => {
    render(
      <IntlProvider locale="en">
        <CourseGlimpse context={contextProps} course={{ ...course, cover_image: null }} />
      </IntlProvider>,
    );

    screen.getByText('Course 42');
    screen.getByText('Cover');
  });
});
