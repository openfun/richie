import { ComponentMeta, ComponentStory } from '@storybook/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import faker from 'faker';
import { CourseFactory } from 'utils/test/factories/joanie';
import { StorybookHelper } from 'utils/StorybookHelper';
import { Priority } from 'types';
import { enrollment } from './mock.stories';
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
    course_run: {
      ...enrollment.course_run,
      end: faker.date.future(1).toISOString(),
      state: { ...enrollment.course_run.state, priority: Priority.FUTURE_NOT_YET_OPEN },
    },
  },
};

export const ReadonlyEnrolledClosed = bind();
ReadonlyEnrolledClosed.args = {
  course: CourseFactory.generate(),
  activeEnrollment: {
    ...enrollment,
    course_run: {
      ...enrollment.course_run,
      end: faker.date.past(1).toISOString(),
      state: { ...enrollment.course_run.state, priority: Priority.FUTURE_CLOSED },
    },
  },
};

export const ReadonlyNotEnrolled = bind();
ReadonlyNotEnrolled.args = {
  course: CourseFactory.generate(),
};
