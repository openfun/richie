import 'testSetup';

import { render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { Course } from 'types/Course';
import { CourseGlimpse } from '.';

describe('<CourseGlimpse />', () => {
  const course = {
    absolute_url: 'https://example/com/courses/42/',
    categories: ['24', '42'],
    categories_data: [
      {
        color: 'red',
        icon: null,
        meta_name: 'subjects',
        meta_title: 'Subjects',
        name: 'physics',
        parent_name: null,
        parent_title: null,
        placeholders: [{ position: 0, slot: 'course_categories' }],
        title: 'Physics',
      },
      {
        color: 'blue',
        icon: {
          sizes: '60px',
          src: 'example.com/icons/subtitled.png',
          srcset: 'example.com/icons/subtitled.png 180w',
        },
        meta_name: 'icons',
        meta_title: 'Icons',
        name: 'subtitled',
        parent_name: 'accessibility',
        parent_title: 'Accessibility',
        placeholders: [
          { position: 1, slot: 'course_categories' },
          { position: 0, slot: 'course_icons' },
        ],
        title: 'Subtitled',
      },
    ],
    cover_image: {
      sizes: '330px',
      src: '/thumbs/small.png',
      srcset: 'some srcset',
    },
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
  } as Course;

  it('renders a course glimpse with its data', () => {
    const { container, getByText } = render(
      <IntlProvider locale="en">
        <CourseGlimpse course={course} />
      </IntlProvider>,
    );

    // The link that wraps the course glimpse should have no title as its content is explicit enough
    expect(container.querySelector('a')).not.toHaveAttribute('title');
    // The course glimpse shows the relevant information
    getByText('Course 42');
    getByText('Some Organization');
    // Matches on 'Starts on Mar 14, 2019', date is wrapped with intl <span>
    getByText(
      (_, element) =>
        element.innerHTML.startsWith('Starts on') &&
        element.innerHTML.includes('Mar 14, 2019'),
    );
    getByText('Enroll now');
    // The logo is rendered along with alt text "" as it is decorative and included in a link block
    const img = container.querySelector('.course-glimpse__media img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('src', '/thumbs/small.png');
    // The category icon is rendered with alt text "" as it is redundant with the category name spelled in full text
    const icon = container.querySelector('.course-glimpse__icon img');
    expect(icon).toHaveAttribute('alt', '');
    expect(icon).toHaveAttribute('src', 'example.com/icons/subtitled.png');
    getByText('Subtitled');
  });

  it('works when there is no call to action or datetime on the state (eg. an archived course)', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseGlimpse
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
    getByText('Course 42');
    getByText('Archived');
  });

  it('works when there is no matching category data for the icon', () => {
    const { getByText, queryByText } = render(
      <IntlProvider locale="en">
        <CourseGlimpse
          course={{
            ...course,
            categories_data: [
              course.categories_data[0],
              {
                ...course.categories_data[1],
                placeholders: [
                  { position: 1, slot: 'course_categories' },
                  { position: 0, slot: 'course_markers' },
                ],
              },
            ],
          }}
        />
      </IntlProvider>,
    );

    // Make sure the component renders but does not pick up any relevant category icon
    getByText('Course 42');
    expect(document.querySelector('.course-glimpse__icon img')).toBeNull();
    expect(queryByText('Subtitled')).toBeNull();
  });

  it('works when categories_data is just empty', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseGlimpse
          course={{
            ...course,
            categories_data: [],
          }}
        />
      </IntlProvider>,
    );

    // Just make sure the component renders
    getByText('Course 42');
  });

  it('shows the "Cover" placeholder div when the course is missing a cover image', () => {
    const { getByText } = render(
      <IntlProvider locale="en">
        <CourseGlimpse course={{ ...course, cover_image: null }} />
      </IntlProvider>,
    );

    getByText('Course 42');
    getByText('Cover');
  });
});
