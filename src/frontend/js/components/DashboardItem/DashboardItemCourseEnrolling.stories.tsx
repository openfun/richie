import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { CourseFactory } from 'utils/test/factories';
import { enrollment } from 'components/DashboardItem/mock.stories';
import { StorybookHelper } from 'utils/StorybookHelper';
import { DashboardItemCourseEnrolling } from './DashboardItemCourseEnrolling';

export default {
  title: 'Components/Dashboard/CourseEnrolling',
  component: DashboardItemCourseEnrolling,
} as ComponentMeta<typeof DashboardItemCourseEnrolling>;

const Template: ComponentStory<typeof DashboardItemCourseEnrolling> = (args) => {
  return StorybookHelper.wrapInApp(
    <RouterProvider
      router={createMemoryRouter([
        {
          index: true,
          element: (
            <div className="dashboard-item__block__footer">
              <DashboardItemCourseEnrolling {...args} />
            </div>
          ),
        },
      ])}
    />,
  );
};

const bind = () => {
  const bound = Template.bind({});
  bound.parameters = {
    docs: {
      source: {
        code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
      },
    },
  };
  return bound;
};

// Readonly

export const ReadonlyEnrolledOpened = bind();
ReadonlyEnrolledOpened.args = {
  course: CourseFactory.generate(),
  activeEnrollment: {
    ...enrollment,
    course_run: { ...enrollment.course_run, end: '2029-10-01T01:23:37+00:00' },
  },
};

export const ReadonlyEnrolledClosed = bind();
ReadonlyEnrolledClosed.args = {
  course: CourseFactory.generate(),
  activeEnrollment: {
    ...enrollment,
    course_run: { ...enrollment.course_run, end: '2021-10-01T01:23:37+00:00' },
  },
};

export const ReadonlyNotEnrolled = bind();
ReadonlyNotEnrolled.args = {
  course: CourseFactory.generate(),
};
